import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

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
        [
            /equilibre et harmonie/,
            "équilibre et harmonie",
        ],

        [
            /maintenir l'equilibre/,
            "maintien de l'équilibre",
        ],

        [
            /maintien de l'equilibre/,
            "maintien de l'équilibre",
        ],

        [
            /energie vitale/,
            "énergie vitale",
        ],

        [
            /\bqi\b/,
            "Qi",
        ],

        [
            /favoriser la circulation/,
            "favoriser la circulation",
        ],

        [
            /favoriser le bien etre/,
            "promesse de bien-être",
        ],

        [
            /promouvoir le bien etre/,
            "promesse de bien-être",
        ],

        [
            /ameliore le bien etre/,
            "promesse de bien-être",
        ],

        [
            /ameliorer le bien etre/,
            "promesse de bien-être",
        ],

        [
            /ameliorer la sante/,
            "formulation santé",
        ],

        [
            /offrir une approche differente du bien etre et de la sante/,
            "formulation santé/bien-être",
        ],

        [
            /garantit/,
            "garantie",
        ],

        [
            /garantie/,
            "garantie",
        ],

        [
            /guerir/,
            "guérison",
        ],

        [
            /guerison/,
            "guérison",
        ],

        [
            /traiter une maladie/,
            "affirmation médicale",
        ],

        [
            /traiter les maladies/,
            "affirmation médicale",
        ],

        [
            /prevenir les maladies/,
            "affirmation médicale",
        ],

        [
            /soigner/,
            "affirmation médicale",
        ],

        [
            /soins medicaux/,
            "affirmation médicale",
        ],

        [
            /efficacite demontree/,
            "efficacité non sourcée",
        ],

        [
            /efficace pour/,
            "promesse d'efficacité",
        ],

        [
            /professionnel certifie/,
            "qualification non vérifiée",
        ],

        [
            /professionnels certifies/,
            "qualification non vérifiée",
        ],

        [
            /professionnel qualifie/,
            "qualification non vérifiée",
        ],

        [
            /professionnels qualifies/,
            "qualification non vérifiée",
        ],

        [
            /praticien qualifie/,
            "qualification non vérifiée",
        ],

        [
            /praticiens qualifies/,
            "qualification non vérifiée",
        ],

        [
            /certification necessaire/,
            "certification non vérifiée",
        ],

        [
            /certifications necessaires/,
            "certification non vérifiée",
        ],

        [
            /diplome necessaire/,
            "diplôme non vérifié",
        ],

        [
            /diplomes necessaires/,
            "diplôme non vérifié",
        ],

        [
            /avis d'autres/,
            "avis non présents",
        ],

        [
            /avis des clients/,
            "avis non présents",
        ],

        [
            /avis clients/,
            "avis non présents",
        ],

        [
            /retours des clients/,
            "avis non présents",
        ],

        [
            /vous accederez a une liste/,
            "liste promise",
        ],

        [
            /vous pourrez trouver/,
            "résultat promis",
        ],

        [
            /pour trouver des professionnels/,
            "résultat promis",
        ],

        [
            /pour trouver un professionnel/,
            "résultat promis",
        ],

        [
            /trouver des professionnels/,
            "résultat promis",
        ],

        [
            /trouver un professionnel/,
            "résultat promis",
        ],

        [
            /trouver des praticiens/,
            "résultat promis",
        ],

        [
            /trouver un praticien/,
            "résultat promis",
        ],

        [
            /trouver celui qui correspond/,
            "résultat promis",
        ],

        [
            /facilitant ainsi l acces/,
            "formulation d'accès",
        ],

        [
            /facilitant l acces/,
            "formulation d'accès",
        ],

        [
            /connaissent bien le contexte/,
            "affirmation non vérifiée",
        ],

        [
            /connaissent mieux le contexte/,
            "affirmation non vérifiée",
        ],

        [
            /besoins de la communaute/,
            "affirmation non vérifiée",
        ],

        [
            /trafic qualifie/,
            "trafic SEO",
        ],

        [
            /generer des clients/,
            "promesse commerciale",
        ],

        [
            /recherches mensuelles/,
            "donnée SEO",
        ],

        [
            /potentiel estime/,
            "donnée SEO",
        ],

        [
            /cpc moyen/,
            "donnée SEO",
        ],

        [
            /concurrence\s*:/,
            "donnée SEO",
        ],

        [
            /meilleur professionnel/,
            "popularité",
        ],

        [
            /les meilleurs/,
            "popularité",
        ],

        [
            /tous les professionnels/,
            "affirmation exhaustive",
        ],

        [
            /l'ensemble des professionnels/,
            "affirmation exhaustive",
        ],

        [
            /liste de professionnels et d'entreprises/,
            "liste exhaustive",
        ],
    ];

    for (const [
        pattern,
        reason,
    ] of forbiddenPatterns) {
        if (
            pattern.test(text)
        ) {
            reasons.push(
                reason
            );
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

function buildGenerationPrompt({
    keyword,
    city,
    profiles = [],
}) {
    const keywordDisplay =
        beautifyKeyword(
            keyword
        );

    const cityDisplay =
        displayCity(city);

    let directoryContext = "";

    if (
        profiles.length > 0
    ) {
        const safeProfiles =
            profiles
                .slice(0, 10)
                .map(
                    (profile) => ({
                        name:
                            profile.name ||
                            "",
                        description:
                            profile.description ||
                            "",
                        keyword:
                            profile.keyword ||
                            "",
                        city:
                            profile.city ||
                            "",
                    })
                );

        directoryContext = `
DONNÉES RÉELLES DISPONIBLES DANS L'ANNUAIRE :

${JSON.stringify(
            safeProfiles,
            null,
            2
        )}

Tu ne dois utiliser que ces informations pour parler de profils précis.

N'invente :
- aucune adresse ;
- aucun numéro ;
- aucun horaire ;
- aucun avis ;
- aucune certification ;
- aucun diplôme ;
- aucune qualification ;
- aucune prestation.
`;
    } else {
        directoryContext = `
AUCUN PROFIL SPÉCIFIQUE N'EST FOURNI.

Reste général et ne parle d'aucune entreprise ou personne précise.
`;
    }

    return `
Tu rédiges une page SEO locale française sur :

"${keywordDisplay}" à "${cityDisplay}"

RÈGLE ABSOLUE :

Le mot-clé doit conserver exactement son sens.

"médecine chinoise" doit rester "médecine chinoise".
Ne transforme jamais ce terme en "médecin chinois".

INTERDICTIONS :

- aucune invention ;
- aucun avis client ;
- aucun chiffre de recherche ;
- aucun CPC ;
- aucun revenu ;
- aucun potentiel financier ;
- aucun trafic estimé ;
- aucune donnée SEO dans le texte ;
- aucune certification inventée ;
- aucun diplôme inventé ;
- aucune qualification inventée ;
- aucune adresse inventée ;
- aucun téléphone inventé ;
- aucun horaire inventé ;
- aucune promesse médicale ;
- aucun traitement ;
- aucune guérison ;
- aucun soin présenté comme efficace ;
- aucune promesse de résultat ;
- aucune garantie ;
- aucun "Qi" ;
- aucune "énergie vitale" ;
- aucun "équilibre du corps" ;
- aucune "harmonie du corps" ;
- aucune affirmation sur l'efficacité ;
- aucun avis ;
- aucun "meilleur professionnel" ;
- aucune liste exhaustive ;
- aucune promesse de trouver un professionnel ;
- aucune expression "vous pourrez trouver" ;
- aucune expression "pour trouver un professionnel" ;
- aucune expression "pour trouver des professionnels" ;
- aucune expression "trouver des praticiens" ;
- aucune affirmation selon laquelle des professionnels connaissent les besoins de la communauté.

Ne dis jamais :
"favoriser la circulation"
"améliorer la santé"
"promouvoir le bien-être"
"garantir"
"efficace pour"
"les meilleurs"
"avis clients".

STYLE :

- français naturel ;
- professionnel ;
- informatif ;
- neutre ;
- SEO local naturel ;
- pas de bourrage de mots-clés ;
- pas de publicité excessive.

STRUCTURE :

# ${keywordDisplay} à ${cityDisplay}

Introduction

## Rechercher ${keywordDisplay} à ${cityDisplay}

## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?

## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?

## Rechercher un professionnel dans notre annuaire SEO

## Questions fréquentes

### Où rechercher ${keywordDisplay} à ${cityDisplay} ?

### Comment choisir un professionnel adapté à ${keywordDisplay} ?

### Quels peuvent être les avantages d'une recherche locale ?

## Conclusion

PARTIE ANNUAIRE :

Explique uniquement que l'annuaire permet de consulter les profils réellement disponibles et les informations publiées sur leurs fiches.

${directoryContext}

Retourne uniquement le contenu final.
`;
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

    const score =
        random(70, 95);

    const volume =
        random(20, 800);

    const difficulty =
        random(10, 70);

    const cpc =
        Number(
            (
                Math.random() *
                4 +
                0.2
            ).toFixed(2)
        );

    const revenue =
        random(50, 1000);

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
                        )
                        } à ${displayCity(
                            row.city ||
                            ""
                        )
                        } | Annuaire SEO`,

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

            let existingPage =
                await db.get(
                    `
            SELECT *
            FROM seo_pages
            WHERE slug = ?
            LIMIT 1
          `,
                    [requestedSlug]
                );

            /*
             * 2. Fallback avec slug normalisé
             */

            if (
                !existingPage &&
                normalizedSlug !==
                requestedSlug
            ) {
                existingPage =
                    await db.get(
                        `
              SELECT *
              FROM seo_pages
              WHERE slug = ?
              LIMIT 1
            `,
                        [normalizedSlug]
                    );
            }

            if (
                !existingPage
            ) {
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

            let page =
                await db.get(
                    `
            SELECT *
            FROM seo_pages
            WHERE slug = ?
            LIMIT 1
          `,
                    [requestedSlug]
                );

            /*
             * Fallback normalisé uniquement
             * si nécessaire.
             */

            if (
                !page &&
                normalizedSlug !==
                requestedSlug
            ) {
                page =
                    await db.get(
                        `
              SELECT *
              FROM seo_pages
              WHERE slug = ?
              LIMIT 1
            `,
                        [normalizedSlug]
                    );
            }

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
               PAGE NOUVELLE
            =================================================== */

            if (!page) {
                const generated =
                    await generateContent(
                        requestedSlug
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

                const score =
                    random(70, 95);

                const volume =
                    random(20, 800);

                const difficulty =
                    random(10, 70);

                const cpc =
                    Number(
                        (
                            Math.random() *
                            4 +
                            0.2
                        ).toFixed(2)
                    );

                const revenue =
                    random(50, 1000);

                const trend =
                    generateTrend();

                await db.run(
                    `
            INSERT INTO seo_pages (
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
              trend
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [
                        generated.keyword,
                        generated.city,
                        requestedSlug,
                        title,
                        generated.content,
                        score,
                        volume,
                        difficulty,
                        cpc,
                        revenue,
                        trend,
                    ]
                );

                page =
                    await db.get(
                        `
              SELECT *
              FROM seo_pages
              WHERE slug = ?
              LIMIT 1
            `,
                        [requestedSlug]
                    );
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