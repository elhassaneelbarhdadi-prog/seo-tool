import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import crypto from "crypto";

import db from "../config/database.js";

const router = express.Router();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const FRONT_URL = (
    process.env.FRONT_URL || "https://referenciaseo.com"
).replace(/\/$/, "");

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
   HELPERS GENERIQUES
========================================================= */

function hash(value = "") {
    return crypto
        .createHash("sha256")
        .update(String(value))
        .digest("hex")
        .slice(0, 12);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTrend() {
    const trends = ["stable", "hausse", "baisse"];
    return trends[random(0, trends.length - 1)];
}

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
        .replace(/[.,;:!?()[\]{}"]/g, " ")
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
    return value.charAt(0).toUpperCase() + value.slice(1);
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
        [/\bcoiffure\b/gi, "coiffure"],
        [/\bpsychologie\b/gi, "psychologie"],
        [/\bregime\b/gi, "régime"],
        [/\bprevention\b/gi, "prévention"],
        [/\btherapie\b/gi, "thérapie"],
        [/\btherapies\b/gi, "thérapies"],
        [/\bnaturel\b/gi, "naturel"],
        [/\bnaturelle\b/gi, "naturelle"],
        [/\bnaturels\b/gi, "naturels"],
        [/\bnaturelles\b/gi, "naturelles"],
        [/\bfrancais\b/gi, "français"],
        [/\bfrancaise\b/gi, "française"],
        [/\bfrancaises\b/gi, "françaises"],
        [/\bfrancais\b/gi, "français"],
        [/\bdecoration\b/gi, "décoration"],
        [/\brenovation\b/gi, "rénovation"],
        [/\breparation\b/gi, "réparation"],
        [/\belectricite\b/gi, "électricité"],
        [/\bmenuiserie\b/gi, "menuiserie"],
        [/\bplomberie\b/gi, "plomberie"],
        [/\bmaconnerie\b/gi, "maçonnerie"],
    ];

    for (const [pattern, replacement] of replacements) {
        value = value.replace(pattern, replacement);
    }

    return value;
}

function displayCity(city = "") {
    const value = String(city).trim();
    return capitalize(value);
}

/* =========================================================
   PARSING DU SLUG
========================================================= */

async function parseSlug(slug = "") {
    const cleanSlug = slugify(slug);

    const businesses = await db.all(`
    SELECT city
    FROM business_profiles
    WHERE city IS NOT NULL
      AND TRIM(city) != ''
    ORDER BY LENGTH(city) DESC
  `);

    const cities = [
        ...new Set(
            (businesses || [])
                .map((row) => String(row.city || "").trim())
                .filter(Boolean)
        ),
    ];

    for (const city of cities) {
        const citySlug = slugify(city);

        if (
            citySlug &&
            cleanSlug.endsWith(`-${citySlug}`) &&
            cleanSlug.length > citySlug.length + 1
        ) {
            const keywordSlug = cleanSlug.slice(
                0,
                -(citySlug.length + 1)
            );

            return {
                keyword: keywordSlug.replace(/-/g, " ").trim(),
                city,
            };
        }
    }

    const parts = cleanSlug.split("-");

    if (parts.length >= 2) {
        const citySlug = parts.pop();

        return {
            keyword: parts.join(" ").trim(),
            city: citySlug.replace(/-/g, " ").trim(),
        };
    }

    return {
        keyword: cleanSlug.replace(/-/g, " ").trim(),
        city: "",
    };
}

/* =========================================================
   CONTEXTE ANNUAIRE
========================================================= */

async function getDirectoryContext(keyword, city) {
    if (!city) return [];

    const rows = await db.all(
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
      WHERE LOWER(TRIM(city)) = LOWER(TRIM(?))
      ORDER BY is_featured DESC, score DESC, id DESC
      LIMIT 20
    `,
        [city]
    );

    const normalizedKeyword = normalizeText(keyword);

    return (rows || []).filter((row) => {
        const rowKeyword = normalizeText(row.keyword || "");
        const rowDescription = normalizeText(row.description || "");

        return (
            !normalizedKeyword ||
            rowKeyword.includes(normalizedKeyword) ||
            normalizedKeyword.includes(rowKeyword) ||
            rowDescription.includes(normalizedKeyword)
        );
    });
}

/* =========================================================
   NETTOYAGE DES REPONSES IA
========================================================= */

function cleanGeneratedContent(content, keyword, city) {
    if (!content) return "";

    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    let cleaned = String(content)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    /*
     * Corrections de formulations récurrentes
     */

    const replacements = [
        [
            /médecin chinois/gi,
            keywordDisplay,
        ],
        [
            /medecin chinois/gi,
            keywordDisplay,
        ],
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
            /professionnel qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],
        [
            /professionnels qualifiés/gi,
            "professionnels correspondant à cette recherche",
        ],
        [
            /professionnel certifié/gi,
            "professionnel correspondant à cette recherche",
        ],
        [
            /professionnels certifiés/gi,
            "professionnels correspondant à cette recherche",
        ],
        [
            /praticien qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],
        [
            /praticiens qualifiés/gi,
            "professionnels correspondant à cette recherche",
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
            /favoriser le bien-être/gi,
            "être présenté comme une pratique associée à ce domaine",
        ],
        [
            /améliorer le bien-être/gi,
            "être présenté dans le cadre de ce domaine",
        ],
        [
            /améliore le bien-être/gi,
            "est présenté dans le cadre de ce domaine",
        ],
        [
            /garantit/gi,
            "peut être présenté comme",
        ],
        [
            /garantie/gi,
            "présentation",
        ],
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
            /vous accéderez à une liste de professionnels/gi,
            "vous pourrez consulter les informations disponibles dans l'annuaire",
        ],
        [
            /vous pourrez trouver des professionnels/gi,
            "vous pourrez consulter les profils disponibles",
        ],
        [
            /trouver des professionnels et des entreprises qui pratiquent/gi,
            "consulter des profils correspondant à cette recherche",
        ],
        [
            /les coordonnées et les adresses des praticiens/gi,
            "les informations affichées sur les profils",
        ],
        [
            /les services proposés, les coordonnées et les adresses/gi,
            "les informations affichées dans les profils",
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
            /chaque professionnel peut avoir des approches et des services différents/gi,
            "les informations peuvent varier selon les profils disponibles",
        ],
        [
            /chaque praticien peut avoir des approches différentes/gi,
            "les informations peuvent varier selon les profils disponibles",
        ],
        [
            /dans la région/gi,
            `à ${cityDisplay}`,
        ],
    ];

    for (const [pattern, replacement] of replacements) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    /*
     * Normalisation des titres principaux
     */

    cleaned = cleaned.replace(
        /^##\s*Rechercher .*$/gim,
        `## Rechercher ${keywordDisplay} à ${cityDisplay}`
    );

    cleaned = cleaned.replace(
        /^##\s*Quels services .*$/gim,
        `## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^##\s*Comment choisir .*$/gim,
        `## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^###\s*Où rechercher .*$/gim,
        `### Où rechercher ${keywordDisplay} à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^###\s*Comment choisir .*$/gim,
        `### Comment choisir un professionnel adapté à ${keywordDisplay} ?`
    );

    return cleaned.trim();
}

/* =========================================================
   VALIDATION STRICTE DU CONTENU
========================================================= */

function validateGeneratedContent(content, keyword, city) {
    const text = normalizeForCheck(content);

    if (!text || text.length < 500) {
        return {
            valid: false,
            reasons: ["contenu trop court"],
        };
    }

    const forbiddenPatterns = [
        {
            test: /equilibre et harmonie/,
            reason: "formulation autour de l'équilibre et de l'harmonie",
        },
        {
            test: /maintenir l'equilibre/,
            reason: "promesse autour du maintien de l'équilibre",
        },
        {
            test: /energie vitale/,
            reason: "référence à l'énergie vitale",
        },
        {
            test: /\bqi\b/,
            reason: "référence au Qi",
        },
        {
            test: /favoriser le bien etre/,
            reason: "promesse de bien-être",
        },
        {
            test: /ameliore le bien etre/,
            reason: "promesse d'amélioration du bien-être",
        },
        {
            test: /garantit/,
            reason: "garantie",
        },
        {
            test: /garantie/,
            reason: "garantie",
        },
        {
            test: /guérir/,
            reason: "promesse de guérison",
        },
        {
            test: /guerir/,
            reason: "promesse de guérison",
        },
        {
            test: /guerison/,
            reason: "référence à la guérison",
        },
        {
            test: /traiter une maladie/,
            reason: "affirmation médicale",
        },
        {
            test: /traiter les maladies/,
            reason: "affirmation médicale",
        },
        {
            test: /prevenir les maladies/,
            reason: "affirmation médicale",
        },
        {
            test: /soigner/,
            reason: "affirmation médicale",
        },
        {
            test: /soins medicaux/,
            reason: "affirmation médicale",
        },
        {
            test: /efficacite demontree/,
            reason: "preuve d'efficacité non sourcée",
        },
        {
            test: /efficace pour/,
            reason: "promesse d'efficacité",
        },
        {
            test: /professionnel certifie/,
            reason: "qualification non vérifiée",
        },
        {
            test: /professionnels certifies/,
            reason: "qualification non vérifiée",
        },
        {
            test: /praticien qualifie/,
            reason: "qualification non vérifiée",
        },
        {
            test: /praticiens qualifies/,
            reason: "qualification non vérifiée",
        },
        {
            test: /professionnel qualifie/,
            reason: "qualification non vérifiée",
        },
        {
            test: /professionnels qualifies/,
            reason: "qualification non vérifiée",
        },
        {
            test: /certification necessaire/,
            reason: "certification présentée comme nécessaire",
        },
        {
            test: /certifications necessaires/,
            reason: "certification présentée comme nécessaire",
        },
        {
            test: /diplome necessaire/,
            reason: "diplôme présenté comme nécessaire",
        },
        {
            test: /diplomes necessaires/,
            reason: "diplôme présenté comme nécessaire",
        },
        {
            test: /vous accederez a une liste/,
            reason: "promesse de liste exhaustive",
        },
        {
            test: /vous pourrez trouver des professionnels/,
            reason: "promesse de résultats",
        },
        {
            test: /liste de professionnels et d'entreprises/,
            reason: "affirmation de liste exhaustive",
        },
        {
            test: /les coordonnees et les adresses des praticiens/,
            reason: "informations non garanties",
        },
        {
            test: /chaque professionnel peut avoir/,
            reason: "affirmation générique non nécessaire",
        },
        {
            test: /tous les professionnels/,
            reason: "affirmation exhaustive",
        },
        {
            test: /l'ensemble des professionnels/,
            reason: "affirmation exhaustive",
        },
        {
            test: /les meilleurs/,
            reason: "affirmation de popularité",
        },
        {
            test: /meilleur professionnel/,
            reason: "affirmation de popularité",
        },
        {
            test: /avis clients/,
            reason: "avis non présents",
        },
        {
            test: /nombre d'avis/,
            reason: "avis non présents",
        },
        {
            test: /note moyenne/,
            reason: "note non sourcée",
        },
        {
            test: /dans toute la region/,
            reason: "portée géographique trop large",
        },
        {
            test: /dans la region/,
            reason: "portée géographique trop large",
        },
    ];

    const reasons = [];

    for (const item of forbiddenPatterns) {
        if (item.test.test(text)) {
            reasons.push(item.reason);
        }
    }

    /*
     * Vérification du mot-clé.
     * On ne veut surtout pas que "médecine chinoise"
     * devienne "médecin chinois".
     */

    const expectedKeyword = normalizeForCheck(keyword);

    if (
        expectedKeyword &&
        !text.includes(expectedKeyword.replace(/[^\w\s-]/g, "").trim())
    ) {
        reasons.push("mot-clé principal insuffisamment présent");
    }

    /*
     * Vérification locale.
     */

    const expectedCity = normalizeForCheck(city);

    if (
        expectedCity &&
        !text.includes(expectedCity)
    ) {
        reasons.push("ville insuffisamment présente");
    }

    return {
        valid: reasons.length === 0,
        reasons,
    };
}

/* =========================================================
   PROMPT PRINCIPAL
========================================================= */

function buildGenerationPrompt({
    keyword,
    city,
    profiles = [],
}) {
    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    let directoryContext = "";

    if (profiles.length > 0) {
        const safeProfiles = profiles.slice(0, 10).map((profile) => ({
            name: profile.name || "",
            description: profile.description || "",
            keyword: profile.keyword || "",
            city: profile.city || "",
        }));

        directoryContext = `
DONNÉES RÉELLES DISPONIBLES DANS L'ANNUAIRE :

${JSON.stringify(safeProfiles, null, 2)}

RÈGLE ABSOLUE :
Tu ne dois utiliser que les informations réellement présentes dans ces données.
N'invente aucune prestation, aucune adresse, aucun numéro, aucun diplôme,
aucune certification, aucun avis, aucun horaire et aucune qualification.
`;
    } else {
        directoryContext = `
AUCUN PROFIL SPÉCIFIQUE N'EST FOURNI POUR CETTE RECHERCHE.

Tu dois donc rester général et ne faire aucune affirmation sur des entreprises
ou des professionnels précis.
`;
    }

    return `
Tu es un rédacteur SEO professionnel pour un annuaire local français.

Tu dois rédiger une page SEO locale sur :

MOT-CLÉ EXACT :
"${keywordDisplay}"

VILLE :
"${cityDisplay}"

OBJECTIF :
Créer une page informative naturelle, utile et adaptée à une recherche locale.

IMPORTANT :
Le mot-clé "${keywordDisplay}" doit conserver exactement son sens.

INTERDICTIONS STRICTES :

- Ne transforme jamais le mot-clé en profession.
- "médecine chinoise" ne doit jamais devenir "médecin chinois".
- Ne présente jamais automatiquement une activité comme un métier.
- Ne parle pas de qualification professionnelle sans information réelle.
- Ne parle pas de certification ou diplôme sans information réelle.
- N'invente aucune adresse.
- N'invente aucun numéro de téléphone.
- N'invente aucun horaire.
- N'invente aucun avis client.
- N'invente aucune note.
- N'invente aucune prestation précise pour un professionnel.
- N'affirme pas qu'un professionnel est qualifié ou certifié.
- Ne dis pas qu'un service guérit, soigne, traite ou prévient une maladie.
- Ne promets aucun résultat.
- N'utilise pas "efficace pour".
- N'utilise pas "garantit".
- N'utilise pas "les meilleurs".
- Ne présente pas une pratique comme ayant une efficacité médicale démontrée.
- Ne parle pas de "Qi", "énergie vitale", "équilibre du corps", "harmonie du corps"
  ou formulations similaires.
- Ne présente pas une pratique comme permettant de maintenir ou restaurer
  un équilibre physique ou psychologique.
- Ne promets pas que l'utilisateur trouvera nécessairement un professionnel.
- Ne prétends pas fournir une liste exhaustive.
- Ne dis pas "vous accéderez à une liste de professionnels".
- Ne dis pas "vous pourrez trouver des professionnels".
- Ne dis pas "tous les professionnels".
- Ne dis pas "l'ensemble des professionnels".
- Ne prétends pas connaître tous les services disponibles dans la ville.

STYLE :

- Français naturel.
- Ton professionnel.
- SEO local sans bourrage de mots-clés.
- Paragraphes courts.
- Informations réellement utiles.
- Pas de texte publicitaire excessif.
- Pas de fausses promesses.
- Pas de contenu médical affirmatif.
- Entre 700 et 1000 mots environ.

STRUCTURE OBLIGATOIRE :

1. Introduction
2. ## Rechercher ${keywordDisplay} à ${cityDisplay}
3. ## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?
4. ## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?
5. ## Rechercher un professionnel dans notre annuaire SEO
6. ## Questions fréquentes
7. ### Où rechercher ${keywordDisplay} à ${cityDisplay} ?
8. ### Comment choisir un professionnel adapté à ${keywordDisplay} ?
9. ### Quels peuvent être les avantages d'une recherche locale ?
10. ## Conclusion

POUR LA PARTIE ANNUAIRE :

Explique simplement que la page permet de consulter les profils réellement
présents dans l'annuaire et de comparer les informations affichées.

Ne promets jamais un résultat.

${directoryContext}

RÈGLE FINALE :

Le texte doit parler de "${keywordDisplay}" à "${cityDisplay}".
Il doit conserver le sens exact du mot-clé.
Il ne doit contenir aucune affirmation médicale, aucune qualification inventée,
aucune information non vérifiée et aucune promesse.

Retourne uniquement le contenu de la page.
`;
}

/* =========================================================
   PROMPT DE REPARATION
========================================================= */

function buildRepairPrompt({
    content,
    keyword,
    city,
    reasons = [],
}) {
    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    return `
Tu dois corriger une page SEO locale existante.

MOT-CLÉ :
"${keywordDisplay}"

VILLE :
"${cityDisplay}"

PROBLÈMES DÉTECTÉS :
${reasons.map((reason) => `- ${reason}`).join("\n")}

CONTENU À CORRIGER :

${content}

CONSIGNES :

1. Conserve le thème et l'intention SEO.
2. Conserve "${keywordDisplay}" sans changer son sens.
3. Ne transforme pas un domaine ou une activité en profession.
4. Supprime toute affirmation médicale.
5. Supprime toute promesse de guérison, de soin, d'efficacité ou de résultat.
6. Supprime toute référence au Qi ou à l'énergie vitale.
7. Supprime les formulations autour de l'équilibre ou de l'harmonie du corps.
8. Supprime les qualifications, diplômes ou certifications non vérifiés.
9. Ne crée aucune information sur les entreprises.
10. Ne crée aucun avis.
11. Ne crée aucune adresse.
12. Ne crée aucun téléphone.
13. Ne crée aucun horaire.
14. Ne prétends pas fournir une liste exhaustive.
15. Ne promets pas que l'utilisateur trouvera un professionnel.
16. Garde une formulation neutre et informative.
17. Conserve une structure SEO claire.

Le résultat doit être un texte propre en français, prêt à être publié.
`;
}

/* =========================================================
   CONTENU DE SECOURS
========================================================= */

function buildFallbackContent(keyword, city, profiles = []) {
    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    const hasProfiles = profiles.length > 0;

    const profileText = hasProfiles
        ? `
Des profils correspondant à cette recherche sont actuellement présents dans
notre annuaire. Les informations affichées sur cette page permettent de
consulter les profils disponibles et de comparer les informations publiées.
`
        : `
Aucun profil spécifique correspondant à cette recherche n'est actuellement
présent dans les données disponibles sur cette page. La recherche peut
néanmoins être utilisée pour consulter les évolutions futures de l'annuaire.
`;

    return `
La recherche « ${keywordDisplay} à ${cityDisplay} » permet de s'intéresser aux
acteurs, entreprises ou services associés à ce domaine dans cette zone
géographique. Cette page présente la recherche locale et indique les
informations disponibles dans notre annuaire SEO.

## Rechercher ${keywordDisplay} à ${cityDisplay}

Une recherche locale permet de cibler une activité, un domaine ou un service
en fonction d'une ville précise. Pour ${keywordDisplay} à ${cityDisplay},
l'annuaire SEO peut servir de point de départ pour consulter les informations
publiées sur les profils disponibles.

La formulation de la recherche peut également être utilisée dans un moteur de
recherche classique afin d'obtenir des résultats locaux correspondant au terme
recherché.

## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?

Les activités associées à ${keywordDisplay} peuvent varier selon les entreprises
ou structures référencées. Il est donc préférable de consulter les informations
effectivement publiées sur chaque profil plutôt que de supposer qu'un service
particulier est disponible.

${profileText}

## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?

Pour comparer les profils disponibles, il est utile de vérifier les
informations réellement affichées sur chaque fiche, notamment l'activité
déclarée, la localisation et les autres renseignements publiés dans
l'annuaire.

Une recherche locale permet ainsi de comparer plusieurs profils selon les
informations disponibles, sans supposer que chaque entreprise propose les mêmes
services.

## Rechercher un professionnel dans notre annuaire SEO

Notre annuaire SEO permet de consulter des profils classés selon leur activité
et leur localisation. Les résultats présentés dépendent des données réellement
enregistrées dans l'annuaire.

Pour une recherche portant sur ${keywordDisplay} à ${cityDisplay}, il est
possible de parcourir les profils affichés puis de comparer les informations
publiées sur chaque fiche.

## Questions fréquentes

### Où rechercher ${keywordDisplay} à ${cityDisplay} ?

La recherche peut être effectuée dans notre annuaire SEO ainsi que dans les
moteurs de recherche en utilisant le terme « ${keywordDisplay} à ${cityDisplay} ».

### Comment choisir un professionnel adapté à ${keywordDisplay} ?

Il est recommandé de comparer les informations disponibles sur les différents
profils et de vérifier les renseignements publiés avant de prendre contact.

### Quels peuvent être les avantages d'une recherche locale ?

Une recherche locale permet de cibler les résultats selon une ville précise et
de comparer plus facilement les informations publiées pour les profils
disponibles.

## Conclusion

La recherche « ${keywordDisplay} à ${cityDisplay} » permet d'orienter les
recherches vers une zone géographique précise. Notre annuaire présente les
profils réellement disponibles et les informations qui leur sont associées.

Pour obtenir une vue plus précise des possibilités disponibles, il est conseillé
de consulter directement les fiches publiées dans l'annuaire.
`.trim();
}

/* =========================================================
   GENERATION IA
========================================================= */

async function generateContent(slug) {
    const parsed = await parseSlug(slug);

    const keyword = parsed.keyword;
    const city = parsed.city;

    const profiles = await getDirectoryContext(keyword, city);

    if (!process.env.OPENAI_API_KEY) {
        return {
            content: buildFallbackContent(keyword, city, profiles),
            keyword,
            city,
            profiles,
            ai: false,
        };
    }

    const prompt = buildGenerationPrompt({
        keyword,
        city,
        profiles,
    });

    let content = "";

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content:
                        "Tu es un rédacteur SEO français très rigoureux. Tu n'inventes aucune information et tu respectes strictement les contraintes fournies.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        content =
            response?.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
        console.error("OPENAI SEO GENERATION ERROR:", error);

        return {
            content: buildFallbackContent(keyword, city, profiles),
            keyword,
            city,
            profiles,
            ai: false,
        };
    }

    content = cleanGeneratedContent(content, keyword, city);

    /*
     * PREMIÈRE VALIDATION
     */

    let validation = validateGeneratedContent(
        content,
        keyword,
        city
    );

    /*
     * REPARATION AUTOMATIQUE
     */

    for (let attempt = 1; attempt <= 2 && !validation.valid; attempt++) {
        try {
            const repairPrompt = buildRepairPrompt({
                content,
                keyword,
                city,
                reasons: validation.reasons,
            });

            const repairedResponse =
                await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    temperature: 0,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Tu corriges du contenu SEO français. Tu supprimes strictement les affirmations non vérifiées et les promesses. Tu ne dois rien inventer.",
                        },
                        {
                            role: "user",
                            content: repairPrompt,
                        },
                    ],
                });

            const repairedContent =
                repairedResponse?.choices?.[0]?.message?.content?.trim() || "";

            if (repairedContent) {
                content = cleanGeneratedContent(
                    repairedContent,
                    keyword,
                    city
                );

                validation = validateGeneratedContent(
                    content,
                    keyword,
                    city
                );
            }
        } catch (error) {
            console.error(
                `SEO CONTENT REPAIR ERROR attempt=${attempt}:`,
                error
            );
        }
    }

    /*
     * SI LE TEXTE RESTE PROBLÉMATIQUE :
     * ON UTILISE LE TEMPLATE DE SECOURS.
     */

    if (!validation.valid) {
        console.warn(
            "SEO CONTENT FALLBACK USED:",
            validation.reasons
        );

        content = buildFallbackContent(
            keyword,
            city,
            profiles
        );
    }

    return {
        content,
        keyword,
        city,
        profiles,
        ai: true,
    };
}

/* =========================================================
   ROUTE : DIRECTORY PAGES
========================================================= */

router.get(
    "/directory-pages",
    seoPageLimiter,
    async (req, res) => {
        try {
            const requestedLimit = Number(req.query.limit || 30);

            const limit = Math.min(
                Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 30, 1),
                100
            );

            /*
             * On récupère uniquement les villes réellement utilisées
             * dans business_profiles.
             */

            const cityRows = await db.all(`
        SELECT DISTINCT city
        FROM business_profiles
        WHERE city IS NOT NULL
          AND TRIM(city) != ''
      `);

            const validCities = new Set(
                (cityRows || [])
                    .map((row) => slugify(row.city || ""))
                    .filter(Boolean)
            );

            if (validCities.size === 0) {
                return res.json({
                    success: true,
                    pages: [],
                    count: 0,
                });
            }

            /*
             * On récupère davantage de résultats que nécessaire afin
             * de pouvoir filtrer les anciennes pages mal formées.
             */

            const rawLimit = Math.min(limit * 3, 300);

            const rows = await db.all(
                `
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
          LIMIT ${rawLimit}
        `
            );

            const seen = new Set();
            const pages = [];

            for (const row of rows || []) {
                const rowSlug = slugify(row.slug || "");
                const rowCitySlug = slugify(row.city || "");

                if (!rowSlug || !rowCitySlug) {
                    continue;
                }

                /*
                 * La page doit être liée à une vraie ville présente
                 * dans l'annuaire.
                 */

                if (!validCities.has(rowCitySlug)) {
                    continue;
                }

                if (!rowSlug.endsWith(`-${rowCitySlug}`)) {
                    continue;
                }

                if (seen.has(rowSlug)) {
                    continue;
                }

                seen.add(rowSlug);

                pages.push({
                    id: row.id,
                    keyword: beautifyKeyword(row.keyword || ""),
                    city: displayCity(row.city || ""),
                    slug: row.slug,
                    title:
                        row.title ||
                        `${beautifyKeyword(row.keyword || "")} à ${displayCity(
                            row.city || ""
                        )} | Annuaire SEO`,
                    content: row.content || "",
                    score: row.score,
                    volume: row.volume,
                    difficulty: row.difficulty,
                    competition: row.difficulty,
                    cpc: row.cpc,
                    revenue: row.revenue,
                    trend: row.trend,
                    created_at: row.created_at,
                });

                if (pages.length >= limit) {
                    break;
                }
            }

            return res.json({
                success: true,
                pages,
                count: pages.length,
            });
        } catch (error) {
            console.error("DIRECTORY PAGES ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération des pages SEO.",
            });
        }
    }
);

/* =========================================================
   ROUTE : REGENERER UNE PAGE EXISTANTE
========================================================= */

router.get(
    "/regenerate",
    seoPageLimiter,
    async (req, res) => {
        try {
            const slug = slugify(req.query.slug || "");

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Slug manquant.",
                });
            }

            const existingPage = await db.get(
                `
          SELECT *
          FROM seo_pages
          WHERE slug = ?
          LIMIT 1
        `,
                [slug]
            );

            if (!existingPage) {
                return res.status(404).json({
                    success: false,
                    message: "Page SEO introuvable.",
                });
            }

            const generated = await generateContent(slug);

            const keyword = generated.keyword;
            const city = generated.city;

            const keywordDisplay = beautifyKeyword(keyword);
            const cityDisplay = displayCity(city);

            const title =
                `${keywordDisplay} à ${cityDisplay} | Annuaire SEO`;

            const content = cleanGeneratedContent(
                generated.content,
                keyword,
                city
            );

            const finalValidation = validateGeneratedContent(
                content,
                keyword,
                city
            );

            const finalContent = finalValidation.valid
                ? content
                : buildFallbackContent(
                    keyword,
                    city,
                    generated.profiles
                );

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
                    keyword,
                    city,
                    title,
                    finalContent,
                    random(70, 95),
                    random(20, 800),
                    random(10, 70),
                    Number((Math.random() * 4 + 0.2).toFixed(2)),
                    random(50, 1000),
                    generateTrend(),
                    slug,
                ]
            );

            const updatedPage = await db.get(
                `
          SELECT *
          FROM seo_pages
          WHERE slug = ?
          LIMIT 1
        `,
                [slug]
            );

            return res.json({
                success: true,
                message: "Page SEO régénérée avec succès",
                page: {
                    ...updatedPage,
                    competition: updatedPage?.difficulty ?? null,
                },
            });
        } catch (error) {
            console.error("SEO REGENERATE ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la régénération de la page SEO.",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }
);

/* =========================================================
   ROUTE : RECUPERER / GENERER UNE PAGE SEO
========================================================= */

router.get(
    "/",
    seoPageLimiter,
    async (req, res) => {
        try {
            const slug = slugify(req.query.slug || "");

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message: "Slug manquant.",
                });
            }

            /*
             * On cherche d'abord une page existante.
             */

            let page = await db.get(
                `
          SELECT *
          FROM seo_pages
          WHERE slug = ?
          LIMIT 1
        `,
                [slug]
            );

            /*
             * Si elle existe déjà, on la renvoie.
             */

            if (page) {
                return res.json({
                    success: true,
                    slug: page.slug,
                    keyword: page.keyword,
                    city: page.city,
                    title: page.title,
                    content: page.content,
                    score: page.score,
                    volume: page.volume,
                    difficulty: page.difficulty,
                    competition: page.difficulty,
                    cpc: page.cpc,
                    revenue: page.revenue,
                    trend: page.trend,
                    created_at: page.created_at,
                });
            }

            /*
             * Sinon, on génère.
             */

            const generated = await generateContent(slug);

            const keyword = generated.keyword;
            const city = generated.city;

            const keywordDisplay = beautifyKeyword(keyword);
            const cityDisplay = displayCity(city);

            const title =
                `${keywordDisplay} à ${cityDisplay} | Annuaire SEO`;

            let content = cleanGeneratedContent(
                generated.content,
                keyword,
                city
            );

            const validation = validateGeneratedContent(
                content,
                keyword,
                city
            );

            if (!validation.valid) {
                content = buildFallbackContent(
                    keyword,
                    city,
                    generated.profiles
                );
            }

            const score = random(70, 95);
            const volume = random(20, 800);
            const difficulty = random(10, 70);
            const cpc = Number(
                (Math.random() * 4 + 0.2).toFixed(2)
            );
            const revenue = random(50, 1000);
            const trend = generateTrend();

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
                ]
            );

            page = await db.get(
                `
          SELECT *
          FROM seo_pages
          WHERE slug = ?
          LIMIT 1
        `,
                [slug]
            );

            return res.json({
                success: true,
                slug: page?.slug || slug,
                keyword: page?.keyword || keyword,
                city: page?.city || city,
                title: page?.title || title,
                content: page?.content || content,
                score: page?.score ?? score,
                volume: page?.volume ?? volume,
                difficulty:
                    page?.difficulty ?? difficulty,
                competition:
                    page?.difficulty ?? difficulty,
                cpc: page?.cpc ?? cpc,
                revenue: page?.revenue ?? revenue,
                trend: page?.trend ?? trend,
                created_at: page?.created_at || null,
            });
        } catch (error) {
            console.error("SEO PAGE ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de la récupération de la page SEO.",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }
);

/* =========================================================
   EXPORT
========================================================= */

export default router;