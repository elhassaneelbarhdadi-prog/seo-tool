import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { fetchRealSEO }
    from "../services/seoReal.service.js";

import db from "../config/database.js";

const router = express.Router();

/* =========================================================
   OPENAI
========================================================= */

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/* =========================================================
   RATE LIMIT
========================================================= */

const seoPageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

/* =========================================================
   HELPERS
========================================================= */

function random(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function generateTrend() {
    return ["stable", "hausse", "baisse"][
        random(0, 2)
    ];
}

/* =========================================================
   NORMALISATION
========================================================= */

function normalizeText(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeForCheck(value = "") {
    return normalizeText(value)
        .replace(/[’']/g, "'")
        .replace(
            /[.,;:!?()[\]{}"«»€$%]/g,
            " "
        )
        .replace(/\s+/g, " ")
        .trim();
}

function slugify(value = "") {
    return normalizeText(value)
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function capitalize(value = "") {
    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

/* =========================================================
   AFFICHAGE FRANÇAIS
========================================================= */

function beautifyKeyword(keyword = "") {
    let value = String(keyword).trim();

    const replacements = [
        [/\bmedecine\b/gi, "médecine"],
        [/\bmedecines\b/gi, "médecines"],
        [/\benergetique\b/gi, "énergétique"],
        [/\benergetiques\b/gi, "énergétiques"],
        [/\besthetique\b/gi, "esthétique"],
        [/\besthetiques\b/gi, "esthétiques"],
        [/\bbeaute\b/gi, "beauté"],
        [/\bregime\b/gi, "régime"],
        [/\bprevention\b/gi, "prévention"],
        [/\btherapie\b/gi, "thérapie"],
        [/\btherapies\b/gi, "thérapies"],
        [/\bdecoration\b/gi, "décoration"],
        [/\brenovation\b/gi, "rénovation"],
        [/\breparation\b/gi, "réparation"],
        [/\belectricite\b/gi, "électricité"],
        [/\bfrancais\b/gi, "français"],
        [/\bfrancaise\b/gi, "française"],
        [/\bfrancaises\b/gi, "françaises"],
        [/\bmaconnerie\b/gi, "maçonnerie"],

        // Corrections des mots courants sans accents
        [/\bvelo\b/gi, "vélo"],
        [/\bvelos\b/gi, "vélos"],
        [/\bitineraire\b/gi, "itinéraire"],
        [/\bitineraires\b/gi, "itinéraires"],
    ];

    for (const [
        pattern,
        replacement,
    ] of replacements) {
        value = value.replace(
            pattern,
            replacement
        );
    }

    return value;
}

function displayCity(city = "") {
    return capitalize(
        String(city).trim()
    );
}

/* =========================================================
   RECHERCHE ROBUSTE D'UNE PAGE SEO
   Gère les slugs avec ou sans accents :
   "vélo-lyon" <=> "velo-lyon"
========================================================= */

async function findSeoPageBySlug(requestedSlug = "") {
    const rawSlug = String(
        requestedSlug || ""
    ).trim();

    if (!rawSlug) {
        return null;
    }

    const normalizedSlug =
        slugify(rawSlug);

    // 1. Recherche exacte
    let page = await db.get(
        `
        SELECT *
        FROM seo_pages
        WHERE slug = ?
        LIMIT 1
        `,
        [rawSlug]
    );

    if (page) {
        return page;
    }

    // 2. Recherche normalisée
    const candidates = await db.all(
        `
        SELECT *
        FROM seo_pages
        WHERE slug IS NOT NULL
          AND TRIM(slug) != ''
        `
    );

    page = (candidates || []).find(
        (row) =>
            slugify(row.slug || "") ===
            normalizedSlug
    );

    return page || null;
}

/* =========================================================
   PARSING DU SLUG
========================================================= */

async function parseSlug(slug = "") {
    const cleanSlug = slugify(slug);

    const rows = await db.all(`
    SELECT city
    FROM business_profiles
    WHERE city IS NOT NULL
      AND TRIM(city) != ''
    ORDER BY LENGTH(city) DESC
  `);

    const cities = [
        ...new Set(
            (rows || [])
                .map((row) =>
                    String(row.city || "").trim()
                )
                .filter(Boolean)
        ),
    ];

    for (const city of cities) {
        const citySlug = slugify(city);

        if (
            citySlug &&
            cleanSlug.endsWith(
                `-${citySlug}`
            ) &&
            cleanSlug.length >
            citySlug.length + 1
        ) {
            const keywordSlug =
                cleanSlug.slice(
                    0,
                    -(citySlug.length + 1)
                );

            return {
                keyword:
                    keywordSlug
                        .replace(/-/g, " ")
                        .trim(),
                city,
            };
        }
    }

    const parts =
        cleanSlug.split("-");

    if (parts.length >= 2) {
        const citySlug =
            parts.pop();

        return {
            keyword:
                parts
                    .join(" ")
                    .trim(),
            city:
                citySlug
                    .replace(/-/g, " ")
                    .trim(),
        };
    }

    return {
        keyword:
            cleanSlug
                .replace(/-/g, " ")
                .trim(),
        city: "",
    };
}

/* =========================================================
   CONTEXTE ANNUAIRE
========================================================= */

async function getDirectoryContext(
    keyword,
    city
) {
    if (!city) {
        return [];
    }

    const rows =
        await db.all(
            `
        SELECT
          id,
          name,
          description,
          keyword,
          city,
          score,
          is_featured
        FROM business_profiles
        WHERE LOWER(TRIM(city))
          = LOWER(TRIM(?))
        ORDER BY
          is_featured DESC,
          score DESC,
          id DESC
        LIMIT 20
      `,
            [city]
        );

    const normalizedKeyword =
        normalizeText(keyword);

    return (
        rows || []
    ).filter((row) => {
        const rowKeyword =
            normalizeText(
                row.keyword || ""
            );

        const rowDescription =
            normalizeText(
                row.description || ""
            );

        return (
            !normalizedKeyword ||
            rowKeyword.includes(
                normalizedKeyword
            ) ||
            normalizedKeyword.includes(
                rowKeyword
            ) ||
            rowDescription.includes(
                normalizedKeyword
            )
        );
    });
}

/* =========================================================
   NETTOYAGE CONTENU IA
========================================================= */

function cleanGeneratedContent(
    content,
    keyword,
    city
) {
    if (!content) {
        return "";
    }

    const keywordDisplay =
        beautifyKeyword(keyword);

    const cityDisplay =
        displayCity(city);

    let cleaned =
        String(content)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(
                /[ \t]+\n/g,
                "\n"
            )
            .replace(
                /\n{3,}/g,
                "\n\n"
            )
            .trim();

    const replacements = [
        /* =========================
           MOT-CLE
        ========================= */

        [
            /médecin chinois/gi,
            keywordDisplay,
        ],

        [
            /medecin chinois/gi,
            keywordDisplay,
        ],

        /* =========================
           QUALIFICATIONS
        ========================= */

        [
            /professionnels de santé spécialisés/gi,
            "professionnels et structures correspondant à cette recherche",
        ],

        [
            /professionnels de santé/gi,
            "professionnels et structures",
        ],

        [
            /praticiens qualifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /praticien qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /professionnels qualifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /professionnel qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /professionnels certifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /professionnel certifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /certifications nécessaires/gi,
            "informations disponibles sur le profil",
        ],

        [
            /certification nécessaire/gi,
            "informations disponibles sur le profil",
        ],

        [
            /diplômes nécessaires/gi,
            "informations disponibles sur le profil",
        ],

        [
            /diplôme nécessaire/gi,
            "informations disponibles sur le profil",
        ],

        /* =========================
           SANTE / BIEN-ETRE
        ========================= */

        [
            /maintenir l'équilibre et l'harmonie/gi,
            "présenter différentes pratiques ou services associés",
        ],

        [
            /maintien de l'équilibre et de l'harmonie/gi,
            "présentation de différentes pratiques ou services associés",
        ],

        [
            /équilibre et l'harmonie au sein du corps/gi,
            "description générale de différentes pratiques associées",
        ],

        [
            /équilibre et harmonie/gi,
            "description générale de différentes pratiques associées",
        ],

        [
            /circulation du qi\s*\(énergie vitale\)/gi,
            "des concepts traditionnels propres à certaines pratiques",
        ],

        [
            /circulation du qi/gi,
            "des concepts traditionnels propres à certaines pratiques",
        ],

        [
            /qi\s*\(énergie vitale\)/gi,
            "des concepts traditionnels",
        ],

        [
            /énergie vitale/gi,
            "des concepts traditionnels",
        ],

        [
            /favoriser la circulation/gi,
            "présenter certaines pratiques associées",
        ],

        [
            /favoriser le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /promouvoir le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /améliorer le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /améliore le bien-être/gi,
            "présente ce domaine",
        ],

        [
            /améliorer la santé/gi,
            "présenter ce domaine",
        ],

        [
            /ameliorer la sante/gi,
            "présenter ce domaine",
        ],

        [
            /offrir une approche différente du bien-être et de la santé/gi,
            "présenter différentes pratiques associées à ce domaine",
        ],

        [
            /offre une approche différente du bien-être et de la santé/gi,
            "présente différentes pratiques associées à ce domaine",
        ],

        /* =========================
           PROMESSES MEDICALES
        ========================= */

        [
            /guérir/gi,
            "prendre en charge",
        ],

        [
            /guérison/gi,
            "prise en charge",
        ],

        [
            /traiter une maladie/gi,
            "présenter une activité ou un service",
        ],

        [
            /traiter les maladies/gi,
            "présenter une activité ou un service",
        ],

        [
            /prévenir les maladies/gi,
            "présenter une activité ou un service",
        ],

        [
            /soigner/gi,
            "proposer",
        ],

        [
            /soigne/gi,
            "propose",
        ],

        [
            /soins médicaux/gi,
            "services présentés",
        ],

        [
            /efficacité démontrée/gi,
            "description disponible",
        ],

        [
            /efficace pour/gi,
            "associé à",
        ],

        [
            /garantit/gi,
            "présente",
        ],

        [
            /garantie/gi,
            "présentation",
        ],

        /* =========================
           AVIS
        ========================= */

        [
            /les avis d'autres personnes/gi,
            "les informations disponibles",
        ],

        [
            /avis d'autres personnes/gi,
            "informations disponibles",
        ],

        [
            /avis des clients/gi,
            "informations disponibles",
        ],

        [
            /avis clients/gi,
            "informations disponibles",
        ],

        [
            /retours des clients/gi,
            "informations disponibles",
        ],

        [
            /les avis et les retours/gi,
            "les informations publiées",
        ],

        /* =========================
           PROMESSES DE RESULTAT
        ========================= */

        [
            /vous accéderez à une liste de professionnels/gi,
            "vous pourrez consulter les informations disponibles dans l'annuaire",
        ],

        [
            /vous pourrez trouver des professionnels/gi,
            "vous pourrez consulter les profils disponibles",
        ],

        [
            /vous pourrez trouver un professionnel/gi,
            "vous pourrez consulter les profils disponibles",
        ],

        [
            /pour trouver des professionnels/gi,
            "pour consulter les profils disponibles",
        ],

        [
            /pour trouver un professionnel/gi,
            "pour consulter les profils disponibles",
        ],

        [
            /afin de trouver des professionnels/gi,
            "afin de consulter les profils disponibles",
        ],

        [
            /afin de trouver un professionnel/gi,
            "afin de consulter les profils disponibles",
        ],

        [
            /trouver des praticiens/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver un praticien/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver des professionnels/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver un professionnel/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver celui qui correspond[^.]*\./gi,
            "comparer les informations disponibles.",
        ],

        /* =========================
           LOCAL / COMMUNAUTE
        ========================= */

        [
            /facilitant ainsi l'accès aux services/gi,
            "permettant de cibler une recherche locale",
        ],

        [
            /facilitant l'accès aux services/gi,
            "permettant de cibler une recherche selon la localisation",
        ],

        [
            /faciliter l'accès aux services/gi,
            "cibler une recherche selon la localisation",
        ],

        [
            /connaissent bien le contexte et les besoins de la communauté locale/gi,
            "sont présentés selon les informations disponibles",
        ],

        [
            /connaissent mieux le contexte et les besoins de la communauté/gi,
            "sont présentés selon les informations disponibles",
        ],

        [
            /besoins de la communauté locale/gi,
            "informations disponibles selon la localisation",
        ],

        [
            /dans la région/gi,
            `à ${cityDisplay}`,
        ],

        /* =========================
           ANCIENS CONTENUS SEO
        ========================= */

        [
            /trafic qualifié/gi,
            "recherche locale",
        ],

        [
            /générer des clients/gi,
            "présenter les informations disponibles",
        ],

        [
            /generer des clients/gi,
            "présenter les informations disponibles",
        ],

        [
            /manière durable grâce au seo/gi,
            "dans le cadre d'une recherche locale",
        ],

        [
            /potentiel estimé\s*:\s*[^<\n]*/gi,
            "",
        ],

        [
            /concurrence\s*:\s*[^<\n]*/gi,
            "",
        ],

        [
            /cpc moyen\s*:\s*[^<\n]*/gi,
            "",
        ],

        [
            /\d[\d\s]*recherches mensuelles/gi,
            "des recherches locales",
        ],
    ];

    for (const [
        pattern,
        replacement,
    ] of replacements) {
        cleaned =
            cleaned.replace(
                pattern,
                replacement
            );
    }

    /* =========================
       TITRES
    ========================= */

    cleaned =
        cleaned.replace(
            /^##\s*Rechercher .*$/gim,
            `## Rechercher ${keywordDisplay} à ${cityDisplay}`
        );

    cleaned =
        cleaned.replace(
            /^##\s*Quels services .*$/gim,
            `## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?`
        );

    cleaned =
        cleaned.replace(
            /^##\s*Comment choisir .*$/gim,
            `## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?`
        );

    cleaned =
        cleaned.replace(
            /^###\s*Où rechercher .*$/gim,
            `### Où rechercher ${keywordDisplay} à ${cityDisplay} ?`
        );

    cleaned =
        cleaned.replace(
            /^###\s*Comment choisir .*$/gim,
            `### Comment choisir un professionnel adapté à ${keywordDisplay} ?`
        );

    return cleaned.trim();
}
/* =========================================================
   VALIDATION STRICTE
========================================================= */

/* =========================================================
   VALIDATION STRICTE
========================================================= */

function validateGeneratedContent(
    content,
    keyword,
    city
) {
    const text =
        normalizeForCheck(content);

    const reasons = [];

    if (
        !text ||
        text.length < 500
    ) {
        reasons.push(
            "contenu trop court"
        );
    }

    const forbiddenPatterns = [
        // =====================================================
        // AFFIRMATIONS MÉDICALES / THÉRAPEUTIQUES
        // =====================================================

        // =====================================================
        // AFFIRMATIONS MÉDICALES / THÉRAPEUTIQUES
        // =====================================================

        [
            /\bguérit\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérir\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérison\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigne les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigne la\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoignent les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoignent la\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigner les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigner la\b/i,
            "affirmation médicale",
        ],

        [
            /\btraite les\b/i,
            "affirmation médicale",
        ],

        [
            /\btraite la\b/i,
            "affirmation médicale",
        ],

        [
            /\btraitent les\b/i,
            "affirmation médicale",
        ],

        [
            /\btraitent la\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermet de traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermet de soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\bpeut traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\bpeut soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermettrait de traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermettrait de soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\bgarantit la guérison\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérison garantie\b/i,
            "affirmation médicale",
        ],

        [
            /\befficace pour traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\befficace pour soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\befficacité garantie\b/i,
            "affirmation médicale",
        ],

        // =====================================================
        // SPÉCIALISATION NON VÉRIFIÉE
        // =====================================================

        [
            /\bspécialiste reconnu\b/i,
            "spécialisation non vérifiée",
        ],

        [
            /\bspécialiste reconnue\b/i,
            "spécialisation non vérifiée",
        ],

        [
            /\bexpert reconnu\b/i,
            "spécialisation non vérifiée",
        ],

        [
            /\bexperte reconnue\b/i,
            "spécialisation non vérifiée",
        ],
        // =====================================================
        // RÉPUTATION / POPULARITÉ NON VÉRIFIÉE
        // =====================================================

        [/\bbonne réputation\b/i, "réputation non vérifiée"],
        [/\bbonne reputation\b/i, "réputation non vérifiée"],
        [/\bmauvaise réputation\b/i, "réputation non vérifiée"],
        [/\bmauvaise reputation\b/i, "réputation non vérifiée"],
        [/\bgagne en popularité\b/i, "popularité non vérifiée"],
        [/\bgagne en popularite\b/i, "popularité non vérifiée"],
        [/\btrès populaire\b/i, "popularité non vérifiée"],
        [/\btrès populaires\b/i, "popularité non vérifiée"],
        [/\btrès apprécié\b/i, "popularité non vérifiée"],
        [/\btrès appréciée\b/i, "popularité non vérifiée"],
        [/\btrès appréciés\b/i, "popularité non vérifiée"],
        [/\btrès appréciées\b/i, "popularité non vérifiée"],

        // =====================================================
        // AFFIRMATIONS LOCALES NON VÉRIFIÉES
        // =====================================================

        [/\bune large gamme\b/i, "affirmation locale non vérifiée"],
        [/\blarge gamme\b/i, "affirmation locale non vérifiée"],
        [/\bune grande variété\b/i, "affirmation locale non vérifiée"],
        [/\bgrande variété\b/i, "affirmation locale non vérifiée"],
        [/\bgrande variete\b/i, "affirmation locale non vérifiée"],
        [/\bvariété de services\b/i, "affirmation locale non vérifiée"],
        [/\bvariete de services\b/i, "affirmation locale non vérifiée"],
        [/\bnombreuses infrastructures\b/i, "affirmation locale non vérifiée"],
        [/\bplusieurs options\b/i, "affirmation locale non vérifiée"],
        [/\bde nombreux services\b/i, "affirmation locale non vérifiée"],
        [/\bde nombreuses entreprises\b/i, "affirmation locale non vérifiée"],
        [/\bde nombreux professionnels\b/i, "affirmation locale non vérifiée"],
        [/\bde nombreux praticiens\b/i, "affirmation locale non vérifiée"],

        // =====================================================
        // DISPONIBILITÉ NON PROUVÉE
        // =====================================================

        // =====================================================
        // DISPONIBILITÉ / OFFRE NON VÉRIFIÉE
        // =====================================================

        // Ne pas bloquer les formulations factuelles
        // concernant les données présentes dans l'annuaire.
        //
        // Exemples autorisés :
        // "profils disponibles"
        // "informations disponibles"
        // "données disponibles"
        // "les informations peuvent être consultées"
        //
        // On bloque uniquement les formulations affirmant
        // qu'un professionnel fournit une prestation précise
        // sans que cette information soit vérifiée.

        [
            /\bce professionnel propose\b/i,
            "disponibilité non prouvée",
        ],

        [
            /\bcette entreprise propose\b/i,
            "disponibilité non prouvée",
        ],

        [
            /\bce professionnel offre\b/i,
            "disponibilité non prouvée",
        ],

        [
            /\bcette entreprise offre\b/i,
            "disponibilité non prouvée",
        ],
        // =====================================================
        // ORGANISATION / ÉVÉNEMENTS NON PROUVÉS
        // =====================================================

        [/\brégulièrement organisés\b/i, "événement non vérifié"],
        [/\brégulièrement organisées\b/i, "événement non vérifié"],
        [/\bregulierement organises\b/i, "événement non vérifié"],
        [/\bregulierement organisees\b/i, "événement non vérifié"],
        [/\bévénements locaux\b/i, "événement non vérifié"],
        [/\bevenements locaux\b/i, "événement non vérifié"],
        [/\binitiatives locales\b/i, "affirmation locale non vérifiée"],

        // =====================================================
        // BÉNÉFICES / PROMESSES NON VÉRIFIÉS
        // =====================================================

        [/\bbien entretenues\b/i, "bénéfice non vérifié"],
        [/\bbien entretenus\b/i, "bénéfice non vérifié"],
        [/\bcirculer en toute sécurité\b/i, "bénéfice non vérifié"],
        [/\bcirculer en toute securite\b/i, "bénéfice non vérifié"],
        [/\bfacilitant l'accès\b/i, "bénéfice non vérifié"],
        [/\bfacilitant l'acces\b/i, "bénéfice non vérifié"],
        [/\bfaciliter l'accès\b/i, "bénéfice non vérifié"],
        [/\bfaciliter l'acces\b/i, "bénéfice non vérifié"],
        [/\bfaciliter la compréhension\b/i, "bénéfice non vérifié"],
        [/\bfaciliter la comprehension\b/i, "bénéfice non vérifié"],
        [/\bprofiter pleinement\b/i, "bénéfice non vérifié"],
        [/\bconnaissent bien la région\b/i, "affirmation locale non vérifiée"],
        [/\bconnaissent bien la region\b/i, "affirmation locale non vérifiée"],
        [/\brelation de confiance\b/i, "affirmation non vérifiée"],

        // =====================================================
        // FORMULATIONS TROP AFFIRMATIVES
        // =====================================================

        [/\bpermet de traiter\b/i, "affirmation médicale"],
        [/\bpermet de soigner\b/i, "affirmation médicale"],
        [/\bpermet de prévenir\b/i, "affirmation médicale"],
        [/\bpermettrait de traiter\b/i, "affirmation médicale"],
        [/\bpeut traiter\b/i, "affirmation médicale"],
        [/\bpeut soigner\b/i, "affirmation médicale"],
        [/\bpeut prévenir\b/i, "affirmation médicale"],

        // =====================================================
        // FORMULATIONS MÉDICALES / THÉRAPEUTIQUES
        // =====================================================

        [
            /\bguérit\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérir\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérison\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigne les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigne la\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoignent les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoignent la\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigner les\b/i,
            "affirmation médicale",
        ],

        [
            /\bsoigner la\b/i,
            "affirmation médicale",
        ],

        [
            /\btraite les\b/i,
            "affirmation médicale",
        ],

        [
            /\btraite la\b/i,
            "affirmation médicale",
        ],

        [
            /\btraitent les\b/i,
            "affirmation médicale",
        ],

        [
            /\btraitent la\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermet de traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\bpermet de soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\bpeut traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\bpeut soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\bgarantit la guérison\b/i,
            "affirmation médicale",
        ],

        [
            /\bguérison garantie\b/i,
            "affirmation médicale",
        ],

        [
            /\befficace pour traiter\b/i,
            "affirmation médicale",
        ],

        [
            /\befficace pour soigner\b/i,
            "affirmation médicale",
        ],

        [
            /\befficacité garantie\b/i,
            "affirmation médicale",
        ],
        // =====================================================
        // QUALIFICATIONS NON VÉRIFIÉES
        // =====================================================

        [
            /\bprofessionnel certifié\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bprofessionnelle certifiée\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bprofessionnel qualifié\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bprofessionnelle qualifiée\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bpraticien qualifié\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bpraticienne qualifiée\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bdiplômé\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bdiplômée\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bcertifié\b/i,
            "qualification non vérifiée",
        ],

        [
            /\bcertifiée\b/i,
            "qualification non vérifiée",
        ],
        // RECONNAISSANCE / POPULARITÉ NON PROUVÉE
        [/\bde plus en plus reconnue\b/i, "reconnaissance non vérifiée"],
        [/\bde plus en plus recherché\b/i, "recherche non vérifiée"],
        [/\bde plus en plus recherchée\b/i, "recherche non vérifiée"],
        [/\breconnue et recherchée\b/i, "reconnaissance non vérifiée"],
        [/\breconnue et recherchee\b/i, "reconnaissance non vérifiée"],

        // =====================================================
        // AFFIRMATIONS SUR LES PROFILS
        // =====================================================

        [
            /\bce professionnel propose\b/i,
            "affirmation sur le profil",
        ],

        [
            /\bcette entreprise propose\b/i,
            "affirmation sur le profil",
        ],

        [
            /\bce professionnel offre\b/i,
            "affirmation sur le profil",
        ],

        [
            /\bcette entreprise offre\b/i,
            "affirmation sur le profil",
        ],
    ];

    for (const [
        pattern,
        reason,
    ] of forbiddenPatterns) {
        if (pattern.test(text)) {
            reasons.push(reason);
        }
    }

    /* =========================
       MOT-CLE
    ========================= */

    const expectedKeyword =
        normalizeForCheck(
            keyword
        );

    if (
        expectedKeyword &&
        !text.includes(
            expectedKeyword
        )
    ) {
        reasons.push(
            "mot-clé principal insuffisamment présent"
        );
    }

    /* =========================
       VILLE
    ========================= */

    const expectedCity =
        normalizeForCheck(
            city
        );

    if (
        expectedCity &&
        !text.includes(
            expectedCity
        )
    ) {
        reasons.push(
            "ville insuffisamment présente"
        );
    }

    return {
        valid:
            reasons.length === 0,
        reasons,
    };
}

/* =========================================================
   FALLBACK
========================================================= */

function buildFallbackContent(
    keyword,
    city,
    profiles = []
) {
    const keywordDisplay =
        beautifyKeyword(
            keyword
        );

    const cityDisplay =
        displayCity(city);

    const hasProfiles =
        profiles.length > 0;

    return `
La recherche « ${keywordDisplay} à ${cityDisplay} » permet de cibler un domaine ou une activité dans une zone géographique précise. Cette page présente les informations disponibles dans notre annuaire SEO et peut servir de point de départ pour une recherche locale.

## Rechercher ${keywordDisplay} à ${cityDisplay}

Une recherche locale permet de cibler ${keywordDisplay} en fonction d'une ville précise. Pour ${cityDisplay}, il est possible de consulter les informations publiées sur les profils disponibles dans l'annuaire et d'utiliser la même formulation dans un moteur de recherche.

## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?

Les activités associées à ${keywordDisplay} peuvent varier selon les entreprises ou structures référencées. Il est préférable de vérifier les informations réellement publiées sur chaque fiche plutôt que de supposer qu'un service particulier est disponible.

${hasProfiles
            ? "Des profils correspondant à cette recherche sont actuellement présents dans notre annuaire. Les informations affichées sur ces fiches peuvent être consultées et comparées."
            : "Aucun profil spécifique correspondant à cette recherche n'est actuellement présent dans les données disponibles sur cette page."
        }

## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?

Pour comparer les profils disponibles, il est utile de vérifier l'activité déclarée, la localisation et les autres renseignements réellement publiés dans chaque fiche. Les informations peuvent varier d'un profil à l'autre.

## Rechercher un professionnel dans notre annuaire SEO

Notre annuaire SEO permet de consulter des profils classés selon leur activité et leur localisation. Les résultats présentés dépendent des données réellement enregistrées dans l'annuaire.

## Questions fréquentes

### Où rechercher ${keywordDisplay} à ${cityDisplay} ?

La recherche peut être effectuée dans notre annuaire SEO et dans les moteurs de recherche en utilisant le terme « ${keywordDisplay} à ${cityDisplay} ».

### Comment choisir un professionnel adapté à ${keywordDisplay} ?

Il est conseillé de comparer les informations disponibles sur les différents profils et de vérifier les renseignements publiés avant de prendre contact.

### Quels peuvent être les avantages d'une recherche locale ?

Une recherche locale permet de cibler les résultats selon une ville précise et de comparer les informations disponibles pour les profils publiés.

## Conclusion

La recherche « ${keywordDisplay} à ${cityDisplay} » permet d'orienter les recherches vers une zone géographique précise. Notre annuaire présente les profils réellement disponibles et les informations qui leur sont associées.
`.trim();
}

/* =========================================================
   PROMPT IA
========================================================= */

/* =========================================================
   PROMPT IA — GÉNÉRATION SEO LOCALE
========================================================= */

/* =========================================================
   PROMPT IA
========================================================= */

function buildGenerationPrompt({
    keyword,
    city,
    profiles = [],
}) {
    const keywordDisplay =
        beautifyKeyword(keyword);

    const cityDisplay =
        displayCity(city);

    let directoryContext = "";

    if (profiles.length > 0) {
        const safeProfiles =
            profiles
                .slice(0, 10)
                .map((profile) => ({
                    name:
                        profile.name || "",
                    description:
                        profile.description || "",
                    keyword:
                        profile.keyword || "",
                    city:
                        profile.city || "",
                }));

        directoryContext = `
DONNÉES RÉELLES DISPONIBLES DANS L'ANNUAIRE

${JSON.stringify(
            safeProfiles,
            null,
            2
        )}

Ces données correspondent aux profils réellement présents
dans l'annuaire.

Tu peux utiliser uniquement les informations présentes
dans ces données.

Tu ne dois jamais inventer pour un profil :

- adresse ;
- téléphone ;
- email ;
- horaires ;
- avis ;
- note ;
- certification ;
- diplôme ;
- qualification ;
- prestation ;
- tarif ;
- expérience ;
- spécialité ;
- résultat ;
- réputation.

Si une information n'est pas présente, ne la mentionne pas.
`;
    } else {
        directoryContext = `
AUCUN PROFIL SPÉCIFIQUE N'EST DISPONIBLE.

Le contenu doit donc rester général.

Ne cite aucune entreprise.
Ne cite aucun professionnel.
Ne crée aucune adresse.
Ne crée aucun numéro de téléphone.
Ne crée aucun horaire.
Ne crée aucune prestation précise.
`;
    }

    return `
Tu es un rédacteur SEO français spécialisé dans la création
de pages locales pour un annuaire professionnel.

Tu dois rédiger le contenu éditorial d'une page consacrée
à la recherche suivante :

"${keywordDisplay}" à "${cityDisplay}"

=========================================================
OBJECTIF
=========================================================

Créer un contenu réellement utile pour une personne qui
effectue cette recherche locale.

Le texte doit être :

- naturel ;
- fluide ;
- informatif ;
- professionnel ;
- crédible ;
- agréable à lire ;
- spécifique à la recherche ;
- rédigé en français naturel.

Le contenu doit donner l'impression d'avoir été écrit
pour cette recherche précise et non d'être un texte
automatiquement reproduit sur des centaines de villes.

=========================================================
IMPORTANT : PAS DE REMPLISSAGE SEO
=========================================================

Ne cherche pas à augmenter artificiellement la longueur.

Chaque paragraphe doit apporter une information différente.

Ne répète pas la même idée avec des formulations différentes.

Évite les formulations génériques et répétitives comme :

"Cette page permet de..."
"Cette recherche permet de..."
"Il est possible de..."
"Il est conseillé de..."
"Il est important de noter..."
"Pour consulter les informations disponibles..."
"Cette page est dédiée à..."
"Les personnes intéressées peuvent..."

N'utilise pas systématiquement ces expressions.

Varie naturellement les formulations.

=========================================================
MOT-CLÉ
=========================================================

Le mot-clé principal est :

"${keywordDisplay}"

La ville est :

"${cityDisplay}"

Respecte exactement le sens du mot-clé.

Ne transforme jamais le mot-clé en une autre activité.

Par exemple :

"médecine chinoise"

ne doit jamais être transformé en :

"médecin chinois"

ou :

"médecin spécialisé en médecine chinoise".

Le mot-clé doit apparaître naturellement dans le contenu.

Ne fais jamais de bourrage de mots-clés.

Utilise des variantes lexicales uniquement lorsqu'elles
améliorent réellement la lecture.

=========================================================
STRUCTURE DU CONTENU
=========================================================

IMPORTANT :

Ne génère PAS de H1.

Le H1 est déjà généré par le site.

Commence directement par une introduction naturelle.

Utilise ensuite des titres H2 et éventuellement H3.

---------------------------------------------------------
INTRODUCTION
---------------------------------------------------------

Rédige une introduction de quelques paragraphes.

Présente naturellement la recherche :

"${keywordDisplay}" à "${cityDisplay}"

Explique ce que peut rechercher une personne utilisant
cette requête et introduis l'intérêt d'une recherche locale.

Ne répète pas simplement le mot-clé plusieurs fois.

---------------------------------------------------------
## Comprendre la recherche locale
---------------------------------------------------------

Explique de manière naturelle ce que signifie rechercher
"${keywordDisplay}" à "${cityDisplay}".

Adapte réellement cette partie au sens du mot-clé.

Ne donne pas d'informations spécifiques sur la ville
si elles ne sont pas présentes dans les données fournies.

---------------------------------------------------------
## Trouver un professionnel à ${cityDisplay}
---------------------------------------------------------

Explique comment une personne peut utiliser un annuaire
pour rechercher un professionnel correspondant au
mot-clé.

Explique concrètement ce qu'elle peut regarder sur une fiche.

Ne promets jamais qu'un professionnel sera disponible.

Ne prétends jamais que l'annuaire recense tous les
professionnels de la ville.

---------------------------------------------------------
## Les informations disponibles dans l'annuaire
---------------------------------------------------------

Présente les types d'informations qu'une fiche peut
contenir lorsqu'elles sont réellement disponibles :

- activité ;
- mot-clé ;
- localisation ;
- description ;
- coordonnées ;
- autres informations publiées.

Ne présente jamais une information comme disponible
si elle n'est pas présente dans les données.

---------------------------------------------------------
## Les profils référencés
---------------------------------------------------------

Si des profils réels sont fournis dans les données,
présente-les de manière naturelle.

Utilise uniquement les informations disponibles.

Ne transforme jamais un simple mot-clé en qualification
professionnelle.

Ne présente jamais une personne comme :

- médecin ;
- thérapeute ;
- spécialiste ;
- expert ;
- diplômé ;
- certifié ;

sauf si cette information est explicitement présente
dans les données.

Si les données sont limitées, indique simplement que
les informations disponibles sur le profil sont limitées.

Si aucun profil n'est fourni, ne crée aucun profil.

---------------------------------------------------------
## Comment comparer les informations
---------------------------------------------------------

Explique comment un utilisateur peut comparer les fiches
en se basant uniquement sur les informations réellement
publiées.

Ne désigne aucun professionnel comme meilleur qu'un autre.

Ne classe pas les professionnels selon une appréciation
subjective.

---------------------------------------------------------
## Questions fréquentes
---------------------------------------------------------

Crée 3 questions réellement utiles et différentes
concernant la recherche :

"${keywordDisplay}" à "${cityDisplay}"

Les réponses doivent être courtes, naturelles et utiles.

Évite les questions artificielles destinées uniquement
à placer le mot-clé.

---------------------------------------------------------
CONCLUSION
---------------------------------------------------------

Termine par un court paragraphe récapitulatif.

La conclusion doit être naturelle.

Ne répète pas mot pour mot l'introduction.

Ne fais pas de promesse commerciale.

=========================================================
CAS PARTICULIER : SANTÉ ET BIEN-ÊTRE
=========================================================

Si le mot-clé concerne la santé, le bien-être ou une pratique
pouvant avoir une dimension médicale :

reste strictement descriptif.

Ne formule aucune promesse médicale.

Ne prétends pas qu'une pratique :

- soigne ;
- guérit ;
- traite ;
- prévient ;
- améliore une maladie ;
- produit un résultat médical.

Ne présente aucune efficacité comme scientifiquement établie
si cette information n'est pas fournie dans les données.

Ne donne aucun conseil médical personnalisé.

Ne transforme jamais un professionnel de l'annuaire en
professionnel de santé sans information explicite.

=========================================================
FIABILITÉ
=========================================================

N'invente absolument aucune donnée.

N'invente pas :

- entreprise ;
- professionnel ;
- adresse ;
- téléphone ;
- email ;
- horaire ;
- tarif ;
- prestation ;
- diplôme ;
- certification ;
- qualification ;
- avis ;
- note ;
- statistique ;
- chiffre ;
- réputation ;
- expérience ;
- résultat.

N'invente aucune donnée concernant ${cityDisplay}.

Ne prétends pas connaître des informations locales
qui ne sont pas fournies.

=========================================================
DONNÉES RÉELLES DE L'ANNUAIRE
=========================================================

${directoryContext}

=========================================================
STYLE
=========================================================

Écris comme un rédacteur professionnel français.

Privilégie :

- des phrases de longueur variable ;
- des paragraphes courts ;
- un vocabulaire naturel ;
- des transitions fluides ;
- des informations concrètes ;
- une lecture agréable.

Évite :

- le ton robotique ;
- les répétitions ;
- les listes inutiles ;
- le bourrage SEO ;
- les formulations identiques ;
- les affirmations non vérifiables ;
- les phrases destinées uniquement à atteindre
  un nombre de mots.

Le contenu doit être utile avant d'être optimisé pour le SEO.

=========================================================
LONGUEUR
=========================================================

Vise environ 700 à 1000 mots lorsque suffisamment
d'informations permettent de produire un contenu utile.

Si les données disponibles sont limitées, privilégie
la qualité et la précision plutôt que le remplissage.

=========================================================
FORMAT FINAL
=========================================================

Retourne uniquement le contenu éditorial.

Ne retourne pas :

- d'explication ;
- de commentaire ;
- de JSON ;
- de balises HTML ;
- de H1 ;
- de texte concernant tes instructions.

Commence directement par l'introduction.
`.trim();
}
/* =========================================================
   REPARATION IA
========================================================= */

async function repairContent(
    content,
    keyword,
    city,
    reasons
) {
    if (
        !process.env.OPENAI_API_KEY
    ) {
        return "";
    }

    const keywordDisplay =
        beautifyKeyword(
            keyword
        );

    const cityDisplay =
        displayCity(city);

    try {
        const response =
            await openai.chat.completions.create(
                {
                    model:
                        "gpt-4o-mini",
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Tu corriges strictement un texte SEO français. Tu ne dois rien inventer.",
                        },
                        {
                            role: "user",
                            content: `
Corrige cette page SEO locale.

MOT-CLÉ :
"${keywordDisplay}"

VILLE :
"${cityDisplay}"

PROBLÈMES DÉTECTÉS :
${reasons
                                    .map(
                                        (reason) =>
                                            `- ${reason}`
                                    )
                                    .join("\n")}

CONTENU :

${content}

RÈGLES :

- Le mot-clé doit conserver exactement son sens.
- "médecine chinoise" reste "médecine chinoise".
- Supprime tous les avis.
- Supprime les promesses de résultat.
- Supprime toute affirmation médicale.
- Supprime Qi.
- Supprime énergie vitale.
- Supprime équilibre du corps.
- Supprime harmonie du corps.
- Supprime "favoriser la circulation".
- Supprime "améliorer la santé".
- Supprime toute qualification non vérifiée.
- Supprime toute donnée SEO.
- Supprime tout chiffre de recherches mensuelles.
- Supprime CPC, revenu, potentiel et trafic.
- Ne promets pas que l'utilisateur trouvera quelqu'un.
- N'invente rien.

Retourne uniquement le contenu corrigé.
`,
                        },
                    ],
                }
            );

        return (
            response?.choices?.[0]
                ?.message
                ?.content
                ?.trim() || ""
        );
    } catch (error) {
        console.error(
            "SEO CONTENT REPAIR ERROR:",
            error.message
        );

        return "";
    }
}
/* =========================================================
   GENERATION DU CONTENU
========================================================= */

async function generateContent(
    slug
) {
    const parsed =
        await parseSlug(slug);

    const keyword =
        parsed.keyword;

    const city =
        parsed.city;

    const profiles =
        await getDirectoryContext(
            keyword,
            city
        );

    let content = "";

    /* =========================
       IA
    ========================= */

    if (
        process.env.OPENAI_API_KEY
    ) {
        try {
            const response =
                await openai.chat.completions.create(
                    {
                        model:
                            "gpt-4o-mini",
                        temperature: 0.1,
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Tu es un rédacteur SEO français extrêmement rigoureux. Tu ne dois rien inventer.",
                            },
                            {
                                role: "user",
                                content:
                                    buildGenerationPrompt({
                                        keyword,
                                        city,
                                        profiles,
                                    }),
                            },
                        ],
                    }
                );

            content =
                response?.choices?.[0]
                    ?.message
                    ?.content
                    ?.trim() || "";
        } catch (error) {
            console.error(
                "OPENAI SEO GENERATION ERROR:",
                error.message
            );
        }
    }

    /* =========================
       FALLBACK
    ========================= */

    if (!content) {
        content =
            buildFallbackContent(
                keyword,
                city,
                profiles
            );
    }

    /* =========================
       NETTOYAGE
    ========================= */

    content =
        cleanGeneratedContent(
            content,
            keyword,
            city
        );

    /* =========================
       VALIDATION
    ========================= */

    let validation =
        validateGeneratedContent(
            content,
            keyword,
            city
        );

    /* =========================
       REPARATIONS
    ========================= */

    for (
        let attempt = 1;
        attempt <= 2 &&
        !validation.valid;
        attempt++
    ) {
        const repaired =
            await repairContent(
                content,
                keyword,
                city,
                validation.reasons
            );

        if (!repaired) {
            break;
        }

        content =
            cleanGeneratedContent(
                repaired,
                keyword,
                city
            );

        validation =
            validateGeneratedContent(
                content,
                keyword,
                city
            );
    }

    /* =========================
       FALLBACK FINAL
    ========================= */

    if (!validation.valid) {
        console.warn(
            "SEO CONTENT FALLBACK USED:",
            validation.reasons
        );

        content =
            buildFallbackContent(
                keyword,
                city,
                profiles
            );
    }

    /* =========================
       VERIFICATION FINALE
    ========================= */

    const finalValidation =
        validateGeneratedContent(
            content,
            keyword,
            city
        );

    if (
        !finalValidation.valid
    ) {
        console.warn(
            "SEO FINAL FALLBACK USED:",
            finalValidation.reasons
        );

        content =
            buildFallbackContent(
                keyword,
                city,
                []
            );
    }

    return {
        keyword,
        city,
        profiles,
        content,
    };
}

/* =========================================================
   SAUVEGARDE
========================================================= */

async function saveGeneratedPage(
    slug
) {
    const generated =
        await generateContent(
            slug
        );

    const keywordDisplay =
        beautifyKeyword(
            generated.keyword
        );

    const cityDisplay =
        displayCity(
            generated.city
        );

    const title =
        `${keywordDisplay} à ${cityDisplay} | Annuaire SEO`;

    /* =====================================================
    DONNEES SEO REELLES
 ===================================================== */

    let seo = {};

    try {

        seo =
            await fetchRealSEO(
                generated.keyword
            );

        console.log(
            "📊 SEO PAGE METRICS:",
            {
                keyword:
                    generated.keyword,

                volume:
                    seo?.volume,

                cpc:
                    seo?.cpc,

                difficulty:
                    seo?.difficulty,

                score:
                    seo?.score,

                revenue:
                    seo?.revenue,

                roiScore:
                    seo?.roiScore,
            }
        );

    } catch (error) {

        console.error(
            "SEO PAGE METRICS ERROR:",
            error.message
        );

        seo = {};
    }


    /* =====================================================
       VOLUME
    ===================================================== */

    const volume =
        Number(
            seo?.volume
        ) || 0;


    /* =====================================================
       DIFFICULTE
    ===================================================== */

    const difficulty =
        Number(
            seo?.difficulty
        ) || 0;


    /* =====================================================
       CPC
    ===================================================== */

    const cpc =
        Number(
            seo?.cpc
        ) || 0;


    /* =====================================================
       SCORE
    ===================================================== */

    let score =
        Number(
            seo?.score
        );

    if (
        !Number.isFinite(score)
    ) {

        score =
            Math.round(
                (
                    Math.log10(
                        volume + 1
                    ) *
                    20 *
                    0.4
                ) +
                (
                    cpc *
                    20 *
                    0.3
                ) +
                (
                    (100 - difficulty) *
                    0.3
                )
            );

        score =
            Math.max(
                0,
                Math.min(
                    100,
                    score
                )
            );
    }


    /* =====================================================
       REVENUE
    ===================================================== */

    /* =====================================================
    REVENUE / POTENTIEL ESTIMÉ
 ===================================================== */

    let revenue =
        Number(
            seo?.revenue
        );

    if (
        !Number.isFinite(revenue)
    ) {

        revenue =
            Math.round(
                volume *
                cpc *
                0.05
            );
    }
    const trend =
        generateTrend();

    await db.run(
        `
      UPDATE seo_pages
      SET
        keyword = ?,
        city = ?,
        title = ?,
        content = ?,
        score = ?,
        volume = ?,
        difficulty = ?,
        cpc = ?,
        revenue = ?,
        trend = ?
      WHERE slug = ?
    `,
        [
            generated.keyword,
            generated.city,
            title,
            generated.content,
            score,
            volume,
            difficulty,
            cpc,
            revenue,
            trend,
            slug,
        ]
    );

    return db.get(
        `
      SELECT *
      FROM seo_pages
      WHERE slug = ?
      LIMIT 1
    `,
        [slug]
    );
}

/* =========================================================
   DIRECTORY PAGES
========================================================= */

router.get(
    "/directory-pages",
    seoPageLimiter,
    async (
        req,
        res
    ) => {
        try {
            const requestedLimit =
                Number(
                    req.query.limit || 30
                );

            const limit =
                Math.min(
                    Math.max(
                        Number.isFinite(
                            requestedLimit
                        )
                            ? requestedLimit
                            : 30,
                        1
                    ),
                    100
                );

            const cityRows =
                await db.all(`
          SELECT DISTINCT city
          FROM business_profiles
          WHERE city IS NOT NULL
            AND TRIM(city) != ''
        `);

            const validCities =
                new Set(
                    (cityRows || [])
                        .map((row) =>
                            slugify(
                                row.city || ""
                            )
                        )
                        .filter(Boolean)
                );

            if (
                validCities.size === 0
            ) {
                return res.json({
                    success: true,
                    pages: [],
                    count: 0,
                });
            }

            const rows =
                await db.all(`
          SELECT
            id,
            keyword,
            city,
            slug,
            title,
            content,
            score,
            volume,
            difficulty,
            cpc,
            revenue,
            trend,
            created_at
          FROM seo_pages
          WHERE slug IS NOT NULL
            AND TRIM(slug) != ''
          ORDER BY created_at DESC
          LIMIT ${Math.min(
                    limit * 3,
                    300
                )}
        `);

            const seen =
                new Set();

            const pages = [];

            for (
                const row of
                rows || []
            ) {
                const rowSlug =
                    slugify(
                        row.slug || ""
                    );

                const rowCitySlug =
                    slugify(
                        row.city || ""
                    );

                if (
                    !rowSlug ||
                    !rowCitySlug
                ) {
                    continue;
                }

                if (
                    !validCities.has(
                        rowCitySlug
                    )
                ) {
                    continue;
                }

                if (
                    !rowSlug.endsWith(
                        `-${rowCitySlug}`
                    )
                ) {
                    continue;
                }

                if (
                    seen.has(rowSlug)
                ) {
                    continue;
                }

                seen.add(
                    rowSlug
                );

                pages.push({
                    id: row.id,

                    keyword:
                        beautifyKeyword(
                            row.keyword ||
                            ""
                        ),

                    city:
                        displayCity(
                            row.city ||
                            ""
                        ),

                    slug:
                        row.slug,

                    title:
                        row.title ||
                        `${beautifyKeyword(
                            row.keyword ||
                            ""
                        )} à ${displayCity(
                            row.city ||
                            ""
                        )} | Annuaire SEO`,

                    content:
                        row.content ||
                        "",

                    score:
                        row.score,

                    volume:
                        row.volume,

                    difficulty:
                        row.difficulty,

                    competition:
                        row.difficulty,

                    cpc:
                        row.cpc,

                    revenue:
                        row.revenue,

                    trend:
                        row.trend,

                    created_at:
                        row.created_at,
                });

                if (
                    pages.length >=
                    limit
                ) {
                    break;
                }
            }

            return res.json({
                success: true,
                pages,
                count:
                    pages.length,
            });
        } catch (error) {
            console.error(
                "DIRECTORY PAGES ERROR:",
                error
            );

            return res.status(
                500
            ).json({
                success: false,
                message:
                    "Erreur lors de la récupération des pages SEO.",
            });
        }
    }
);

/* =========================================================
   REGENERER UNE PAGE EXISTANTE
   IMPORTANT :
   On conserve le slug exact de la base,
   y compris les accents.
========================================================= */

router.get(
    "/regenerate",
    seoPageLimiter,
    async (
        req,
        res
    ) => {
        try {
            const requestedSlug =
                String(
                    req.query.slug ||
                    ""
                ).trim();

            const normalizedSlug =
                slugify(
                    requestedSlug
                );

            if (!requestedSlug) {
                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        "Slug manquant.",
                });
            }

            /*
             * 1. Recherche avec le slug EXACT
             */

            const existingPage =
                await findSeoPageBySlug(
                    requestedSlug
                );

            if (!existingPage) {
                return res.status(
                    404
                ).json({
                    success: false,
                    message:
                        "Page SEO introuvable.",
                });
            }

            /*
             * IMPORTANT :
             * on utilise le slug réellement présent
             * dans SQLite.
             */

            const slugToRegenerate =
                existingPage.slug;

            console.log(
                "♻️ SEO REGEN:",
                {
                    requestedSlug,
                    slugToRegenerate,
                    id: existingPage.id,
                }
            );

            const updatedPage =
                await saveGeneratedPage(
                    slugToRegenerate
                );

            return res.json({
                success: true,

                message:
                    "Page SEO régénérée avec succès",

                page: {
                    ...updatedPage,

                    competition:
                        updatedPage?.difficulty ??
                        null,
                },
            });
        } catch (error) {
            console.error(
                "SEO REGENERATE ERROR:",
                error
            );

            return res.status(
                500
            ).json({
                success: false,
                message:
                    "Erreur lors de la régénération de la page SEO.",
            });
        }
    }
);

/* =========================================================
   RECUPERER / CREER UNE PAGE
========================================================= */

router.get(
    "/",
    seoPageLimiter,
    async (
        req,
        res
    ) => {
        try {
            const requestedSlug =
                String(
                    req.query.slug ||
                    ""
                ).trim();

            const normalizedSlug =
                slugify(
                    requestedSlug
                );

            if (!requestedSlug) {
                return res.status(
                    400
                ).json({
                    success: false,
                    message:
                        "Slug manquant.",
                });
            }

            /*
             * Recherche exacte en premier.
             */

            /*
             * Recherche robuste :
             * retrouve les slugs avec ou sans accents.
             *
             * Exemple :
             * velo-lyon
             * retrouve également :
             * vélo-lyon
             */

            let page =
                await findSeoPageBySlug(
                    requestedSlug
                );

            /* ===================================================
               PAGE EXISTANTE
            =================================================== */

            if (page) {
                const validation =
                    validateGeneratedContent(
                        page.content ||
                        "",
                        page.keyword ||
                        "",
                        page.city ||
                        ""
                    );

                const missingTitle =
                    !page.title ||
                    !String(
                        page.title
                    ).trim();

                /*
                 * Ancienne page invalide :
                 * on la régénère.
                 */

                if (
                    !validation.valid ||
                    missingTitle
                ) {
                    console.log(
                        "♻️ SEO OLD PAGE INVALID -> REGEN:",
                        page.slug,
                        validation.reasons
                    );

                    page =
                        await saveGeneratedPage(
                            page.slug
                        );
                }
            }

            /* ===================================================
               PAGE INEXISTANTE

               IMPORTANT :
               Une URL inconnue ne doit pas créer
               automatiquement une page SEO.

               Cela évite notamment qu'une URL erronée,
               une ancienne URL avec des espaces ou un robot
               puisse remplir la table seo_pages.
            =================================================== */

            if (!page) {

                console.log(
                    "❌ SEO PAGE NOT FOUND:",
                    {
                        requestedSlug,
                        normalizedSlug,
                    }
                );

                return res.status(
                    404
                ).json({
                    success: false,

                    message:
                        "Page SEO introuvable.",

                    slug:
                        normalizedSlug,
                });
            }

            /* ===================================================
               REPONSE
            =================================================== */

            return res.json({
                success: true,
                slug:
                    page.slug,
                keyword:
                    page.keyword,
                city:
                    page.city,
                title:
                    page.title,
                content:
                    page.content,
                score:
                    page.score,
                volume:
                    page.volume,
                difficulty:
                    page.difficulty,
                competition:
                    page.difficulty,
                cpc:
                    page.cpc,
                revenue:
                    page.revenue,
                trend:
                    page.trend,
                created_at:
                    page.created_at,
            });
        } catch (error) {
            console.error(
                "SEO PAGE ERROR:",
                error
            );

            return res.status(
                500
            ).json({
                success: false,
                message:
                    "Erreur lors de la récupération de la page SEO.",
            });
        }
    }
);

/* =========================================================
   EXPORT ESM
========================================================= */

export default router;