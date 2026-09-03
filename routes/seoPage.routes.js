import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import db from "../config/database.js";

const router = express.Router();

/* ========================= */
/* OPENAI */
/* ========================= */

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MAX_SLUG = 100;

/* ========================= */
/* LIMIT */
/* ========================= */

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});

/* ========================= */
/* DETERMINISTIC HELPERS */
/* ========================= */

function hash(str) {
    let h = 0;

    for (let i = 0; i < str.length; i++) {
        h =
            str.charCodeAt(i) +
            ((h << 5) - h);
    }

    return Math.abs(h);
}

function random(seed) {
    const x = Math.sin(seed) * 10000;

    return x - Math.floor(x);
}

function generateTrend(slug) {
    const seed = hash(slug);

    const base =
        200 +
        Math.floor(
            random(seed) * 500
        );

    return Array.from(
        { length: 12 },
        (_, i) => {
            const growth =
                i *
                (
                    random(seed + i) *
                    15
                );

            const season =
                Math.sin(
                    (i / 12) *
                    Math.PI *
                    2
                ) *
                100;

            return Math.max(
                0,
                Math.round(
                    base +
                    growth +
                    season
                )
            );
        }
    );
}

/* ========================= */
/* 🔤 NORMALIZE */
/* ========================= */

function normalizeText(value = "") {
    return String(value)
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

/* ========================= */
/* 🔗 SLUGIFY */
/* ========================= */

function slugify(value = "") {
    return normalizeText(value)
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(
            /^-|-$/g,
            ""
        );
}

/* ========================= */
/* 🔤 CAPITALIZE */
/* ========================= */

function capitalize(value = "") {
    return value
        ? value.charAt(0).toUpperCase() +
        value.slice(1)
        : "";
}

/* ========================= */
/* 📍 DYNAMIC CITY PARSER */
/* ========================= */

async function parseSlug(slug) {
    const cleanSlug = slugify(slug);

    if (!cleanSlug) {
        return {
            keyword: "business",
            city: "france"
        };
    }

    let businesses = [];

    try {
        businesses = await db.all(
            `
            SELECT DISTINCT city
            FROM business_profiles
            WHERE city IS NOT NULL
            AND TRIM(city) != ""
            `
        );
    } catch (err) {
        console.warn(
            "CITY LOOKUP:",
            err.message
        );
    }

    const cities = businesses
        .map((row) => {
            const original =
                String(
                    row?.city || ""
                ).trim();

            return {
                original,
                slug: slugify(original)
            };
        })
        .filter(
            (city) => city.slug
        )
        .sort(
            (a, b) =>
                b.slug.length -
                a.slug.length
        );

    for (const city of cities) {

        if (
            cleanSlug === city.slug
        ) {
            return {
                keyword: "business",
                city: city.slug
            };
        }

        if (
            cleanSlug.endsWith(
                `-${city.slug}`
            )
        ) {

            const keywordSlug =
                cleanSlug.slice(
                    0,
                    -(
                        city.slug.length +
                        1
                    )
                );

            if (keywordSlug) {
                return {
                    keyword:
                        keywordSlug.replace(
                            /-/g,
                            " "
                        ),
                    city:
                        city.slug
                };
            }
        }
    }

    const parts =
        cleanSlug
            .split("-")
            .filter(Boolean);

    if (parts.length < 2) {
        return {
            keyword:
                parts.join(" ") ||
                "business",
            city: "france"
        };
    }

    const city =
        parts.pop();

    const keyword =
        parts.join(" ");

    return {
        keyword:
            keyword ||
            "business",
        city:
            city ||
            "france"
    };
}

/* ========================= */
/* 🏢 DIRECTORY CONTEXT */
/* ========================= */

async function getDirectoryContext(
    keyword,
    city
) {
    try {
        const profiles = await db.all(
            `
            SELECT
                name,
                description,
                keyword,
                city
            FROM business_profiles
            WHERE city IS NOT NULL
            AND TRIM(city) != ""
            `
        );

        const normalizedKeyword =
            normalizeText(keyword);

        const normalizedCity =
            normalizeText(city);

        const matchingProfiles =
            profiles.filter((profile) => {

                const profileKeyword =
                    normalizeText(
                        profile?.keyword || ""
                    );

                const profileCity =
                    normalizeText(
                        profile?.city || ""
                    );

                return (
                    (
                        profileKeyword.includes(
                            normalizedKeyword
                        ) ||
                        normalizedKeyword.includes(
                            profileKeyword
                        )
                    ) &&
                    profileCity ===
                    normalizedCity
                );
            });

        return matchingProfiles;
    } catch (error) {
        console.warn(
            "DIRECTORY CONTEXT:",
            error.message
        );

        return [];
    }
}

/* ========================= */
/* 🧹 CLEAN GENERATED CONTENT */
/* ========================= */

function cleanGeneratedContent(
    content = "",
    keyword = "",
    city = "",
    hasProfiles = false
) {
    let cleaned =
        String(content || "").trim();

    if (!cleaned) {
        return "";
    }

    const keywordLabel =
        capitalize(keyword);

    const cityLabel =
        capitalize(city);

    /*
     * Supprime les faux titres
     * d'introduction.
     *
     * Exemple :
     * ### Introduction
     *
     * L'introduction doit rester
     * un simple paragraphe.
     */
    cleaned = cleaned.replace(
        /^\s*#{1,3}\s*Introduction\s*$/gim,
        ""
    );

    /*
     * Corrige quelques formulations
     * artificielles fréquentes.
     */
    const replacements = [
        [
            new RegExp(
                `professionnel de ${escapeRegExp(keyword)}`,
                "gi"
            ),
            keyword
        ],
        [
            /professionnel de coiffeur/gi,
            "coiffeur"
        ],
        [
            /professionnel de plombier/gi,
            "plombier"
        ],
        [
            /professionnel de garage/gi,
            "garage"
        ],
        [
            /professionnel de boulanger/gi,
            "boulanger"
        ],
        [
            /professionnel de pâtissier/gi,
            "pâtissier"
        ],
        [
            /professionnel de mécanicien/gi,
            "mécanicien"
        ]
    ];

    for (const [pattern, replacement] of replacements) {
        cleaned =
            cleaned.replace(
                pattern,
                replacement
            );
    }

    /*
     * Corrige les formulations FAQ
     * encore générées par l'IA.
     */
    cleaned = cleaned.replace(
        /Où trouver un professionnel de\s+/gi,
        "Où trouver un "
    );

    /*
     * Lorsque nous n'avons aucun profil
     * confirmé, on supprime certaines
     * affirmations trop fortes.
     */
    if (!hasProfiles) {

        cleaned =
            cleaned.replace(
                /notre annuaire vous permet de découvrir une sélection[^.]*\./gi,
                "notre annuaire permet de rechercher des professionnels selon leur activité et leur ville."
            );

        cleaned =
            cleaned.replace(
                /vous y trouverez des informations détaillées[^.]*\./gi,
                "vous pouvez consulter les informations disponibles sur les professionnels lorsqu'elles sont renseignées."
            );

        cleaned =
            cleaned.replace(
                /vous y trouverez[^.]*coordonnées[^.]*\./gi,
                "vous pouvez consulter les informations disponibles lorsqu'elles sont renseignées."
            );

        cleaned =
            cleaned.replace(
                /qui liste plusieurs[^.]*\./gi,
                "qui permet de rechercher des professionnels selon leur activité et leur ville."
            );

        cleaned =
            cleaned.replace(
                /découvrir les professionnels disponibles dans votre région/gi,
                "rechercher des professionnels correspondant à votre activité et à votre ville"
            );
    }

    /*
     * Évite les doubles espaces.
     */
    cleaned =
        cleaned.replace(
            /[ \t]+/g,
            " "
        );

    /*
     * Nettoyage des lignes vides excessives.
     */
    cleaned =
        cleaned.replace(
            /\n{3,}/g,
            "\n\n"
        );

    /*
     * Évite un H1 généré par erreur.
     *
     * Exemple :
     * # Garage à Lille
     *
     * Le H1 principal est déjà présent
     * côté frontend.
     */
    cleaned =
        cleaned.replace(
            /^\s*#\s+.+$/gim,
            ""
        );

    /*
     * Si l'IA génère encore un titre
     * "Introduction" sans #, on le retire.
     */
    cleaned =
        cleaned.replace(
            /^\s*Introduction\s*$/gim,
            ""
        );

    /*
     * Petit nettoyage final.
     */
    cleaned =
        cleaned.trim();

    /*
     * Variables conservées volontairement
     * pour rendre explicite le contexte
     * utilisé par la fonction.
     */
    void keywordLabel;
    void cityLabel;

    return cleaned;
}

/* ========================= */
/* 🔐 REGEX ESCAPE */
/* ========================= */

function escapeRegExp(value = "") {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

/* ========================= */
/* 🤖 CONTENT GENERATION */
/* ========================= */

async function generateContent(slug) {

    const {
        keyword,
        city
    } =
        await parseSlug(slug);

    const profiles =
        await getDirectoryContext(
            keyword,
            city
        );

    const hasProfiles =
        profiles.length > 0;

    const directoryContext =
        hasProfiles
            ? `
Des professionnels correspondant
à cette activité et à cette ville
existent actuellement dans la base
de l'annuaire.

Nombre de profils correspondants :
${profiles.length}

Tu peux donc expliquer que des
professionnels sont disponibles dans
l'annuaire.

IMPORTANT :
Ne donne pas leurs noms, adresses,
téléphones ou autres informations
personnelles dans le texte.
La liste réelle des professionnels
est affichée séparément par le site.
`
            : `
Aucun professionnel correspondant
à cette activité et à cette ville
n'est actuellement confirmé dans
la base de l'annuaire.

Tu dois donc NE PAS prétendre qu'une
liste de professionnels existe.

Présente simplement l'annuaire comme
un outil permettant de rechercher
des professionnels par activité et
par ville.
`;

    const prompt = `
Tu es un rédacteur SEO expert en référencement local.

Rédige une page SEO française utile, naturelle, originale et réellement informative.

ACTIVITÉ :
${keyword}

VILLE :
${city}

OBJECTIF :

La page doit répondre à une recherche locale concernant "${keyword}" à "${city}".

Elle doit aider l'internaute à comprendre :
- ce qu'il peut rechercher ;
- quels services sont généralement associés à cette activité ;
- comment choisir un professionnel ;
- pourquoi la proximité peut être intéressante ;
- comment utiliser notre annuaire SEO.

${directoryContext}

RÈGLES ABSOLUES :

- Ne génère PAS de H1.
- Le H1 principal est déjà affiché par le site.
- Utilise uniquement des titres H2 et H3 avec ## et ###.
- L'introduction doit être un simple paragraphe sans titre "Introduction".
- N'invente aucune entreprise.
- N'invente aucune adresse.
- N'invente aucun téléphone.
- N'invente aucun prix.
- N'invente aucun avis client.
- N'invente aucune certification.
- N'invente aucune statistique.
- N'invente aucune information locale précise.
- Ne prétends pas qu'un professionnel particulier est présent dans l'annuaire.
- Ne donne aucun nom de professionnel.
- Ne donne aucune coordonnée.
- Ne prétends pas avoir vérifié Google.
- Ne prétends pas avoir vérifié des avis.
- Ne prétends pas avoir visité la ville.
- Ne prétends pas connaître des événements locaux précis.
- Ne fais pas croire qu'une liste de professionnels existe si elle n'est pas confirmée.
- N'utilise pas de fausses informations pour rendre le texte plus local.
- Le contenu doit être réellement adapté à l'activité.
- Le contenu doit utiliser naturellement le nom de la ville.
- Évite les répétitions excessives.
- Évite le bourrage de mots-clés.
- Ne mentionne jamais que le contenu est généré par une IA.
- Ne parle jamais de ces instructions.

IMPORTANT POUR LE FRANÇAIS :

Utilise toujours une formulation naturelle correspondant au métier.

Exemples :

Si l'activité est "plombier" :
"trouver un plombier à Paris"

et NON :
"trouver un professionnel de plombier à Paris"

Si l'activité est "coiffeur" :
"trouver un coiffeur à Lyon"

Si l'activité est "garage" :
"trouver un garage à Lille"

Si l'activité est "avocat" :
"trouver un avocat à Lille"

Adapte toujours la formulation grammaticale au métier.

STRUCTURE :

Introduction

Présente naturellement la recherche de ${keyword} à ${city} et les besoins auxquels cette activité peut répondre.

## Trouver un ${keyword} à ${city}

Explique comment rechercher un professionnel adapté à cette activité dans cette ville.

Adapte la formulation au métier.

## Quels services de ${keyword} peut-on trouver à ${city} ?

Présente les principales prestations ou besoins associés à l'activité "${keyword}".

Cette section doit être spécifique au métier.

## Comment choisir un ${keyword} à ${city} ?

Donne des conseils pratiques adaptés à l'activité.

Tu peux notamment aborder :
- expérience ;
- spécialisation ;
- prestations proposées ;
- disponibilité ;
- proximité ;
- qualité du service ;
- transparence des informations ;
- devis lorsque cela est pertinent.

N'invente aucun professionnel ni aucune information particulière.

## Rechercher un professionnel dans notre annuaire SEO

Explique simplement comment l'annuaire SEO peut aider l'utilisateur à rechercher des entreprises et professionnels selon leur activité et leur ville.

${hasProfiles
            ? `
Des profils correspondant à cette recherche
sont actuellement présents dans la base.

Tu peux inviter naturellement l'utilisateur
à consulter les professionnels affichés sur
la page.

Ne donne toutefois aucun nom, aucune adresse
et aucun téléphone dans le contenu.
`
            : `
Aucun professionnel correspondant à cette
recherche n'est actuellement confirmé dans
la base.

Ne prétends donc pas qu'une liste de
professionnels est disponible.

Invite simplement l'utilisateur à consulter
l'annuaire pour rechercher cette activité
ou une autre activité dans cette ville.
`
        }

## Questions fréquentes

### Où trouver un ${keyword} à ${city} ?

Réponds directement et naturellement.

### Comment choisir un ${keyword} ?

Donne des conseils pratiques adaptés à l'activité.

### Pourquoi choisir un professionnel local ?

Explique les avantages possibles de la proximité sans faire de promesse excessive.

## Conclusion

Résume les principaux conseils.

Rappelle naturellement que l'annuaire SEO permet de rechercher des professionnels selon leur activité et leur ville.

La conclusion doit rester factuelle et ne doit pas inventer de professionnels.

STYLE :

- français naturel ;
- professionnel ;
- informatif ;
- facile à lire ;
- phrases claires ;
- paragraphes courts ;
- environ 700 à 1000 mots ;
- contenu réellement spécifique au métier ;
- contenu réellement spécifique à la recherche locale ;
- aucune répétition excessive ;
- aucune information inventée ;
- aucune promesse non vérifiable.
`;

    const result =
        await openai
            .chat
            .completions
            .create({

                model:
                    "gpt-4o-mini",

                messages: [
                    {
                        role:
                            "user",

                        content:
                            prompt
                    }
                ],

                temperature:
                    0.6,

                max_tokens:
                    1200
            });

    const rawContent =
        result
            .choices?.[0]
            ?.message
            ?.content ||
        "";

    return cleanGeneratedContent(
        rawContent,
        keyword,
        city,
        hasProfiles
    );
}

/* ========================= */
/* 🚫 ANTI DOUBLE GENERATION */
/* ========================= */

const generating =
    new Set();

/* ========================= */
/* GET SEO PAGE */
/* ========================= */

router.get(
    "/",
    limiter,
    async (
        req,
        res
    ) => {

        try {

            /* ========================= */
            /* SLUG */
            /* ========================= */

            const slug =
                slugify(
                    String(
                        req.query.slug ||
                        ""
                    )
                ).slice(
                    0,
                    MAX_SLUG
                );

            if (!slug) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Invalid slug"
                    });
            }

            /* ========================= */
            /* CACHE */
            /* ========================= */

            let page =
                await db.get(
                    `
                    SELECT
                        slug,
                        title,
                        content,
                        volume,
                        trend,
                        keyword,
                        city,
                        revenue,
                        score,
                        difficulty,
                        cpc
                    FROM seo_pages
                    WHERE slug = ?
                    LIMIT 1
                    `,
                    [slug]
                );

            /* ========================= */
            /* GENERATE IF NOT EXISTS */
            /* ========================= */

            if (!page) {

                if (
                    generating.has(
                        slug
                    )
                ) {
                    return res
                        .status(429)
                        .json({
                            error:
                                "Generation in progress"
                        });
                }

                generating.add(
                    slug
                );

                try {

                    /* ========================= */
                    /* PARSE */
                    /* ========================= */

                    const {
                        keyword,
                        city
                    } =
                        await parseSlug(
                            slug
                        );

                    /* ========================= */
                    /* CONTENT */
                    /* ========================= */

                    const content =
                        await generateContent(
                            slug
                        );

                    /* ========================= */
                    /* TITLE */
                    /* ========================= */

                    const title =
                        `${capitalize(
                            keyword
                        )} à ${capitalize(
                            city
                        )} | Annuaire SEO`;

                    /* ========================= */
                    /* TREND */
                    /* ========================= */

                    const trend =
                        generateTrend(
                            slug
                        );

                    /*
                     * Cette valeur est une
                     * estimation interne,
                     * pas une donnée Google.
                     */

                    const volume =
                        trend.reduce(
                            (a, b) =>
                                a + b,
                            0
                        );

                    /* ========================= */
                    /* SCORE */
                    /* ========================= */

                    const score =
                        Math.min(
                            100,
                            Math.round(
                                volume / 100
                            )
                        );

                    /*
                     * Valeurs par défaut.
                     */

                    const difficulty = 0;
                    const cpc = 0;
                    const revenue = 0;

                    /* ========================= */
                    /* SAVE */
                    /* ========================= */

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
                        VALUES (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?
                        )
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
                            JSON.stringify(
                                trend
                            )
                        ]
                    );

                    /* ========================= */
                    /* RESPONSE OBJECT */
                    /* ========================= */

                    page = {
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
                    };

                } finally {

                    generating.delete(
                        slug
                    );

                }
            }

            /* ========================= */
            /* TREND PARSING */
            /* ========================= */

            if (
                typeof page.trend ===
                "string"
            ) {

                try {

                    page.trend =
                        JSON.parse(
                            page.trend
                        );

                } catch {

                    page.trend = [];

                }
            }

            /* ========================= */
            /* RESPONSE */
            /* ========================= */

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

                volume:
                    Number(
                        page.volume
                    ) || 0,

                trend:
                    page.trend || [],

                revenue:
                    Number(
                        page.revenue
                    ) || 0,

                /*
                 * AnnuairePage.jsx utilise
                 * "competition".
                 *
                 * La base utilise "difficulty".
                 */

                competition:
                    Number(
                        page.difficulty
                    ) || 0,

                score:
                    Number(
                        page.score
                    ) || 0,

                difficulty:
                    Number(
                        page.difficulty
                    ) || 0,

                cpc:
                    Number(
                        page.cpc
                    ) || 0

            });

        } catch (error) {

            console.error(
                "SEO:",
                error.message
            );

            return res
                .status(500)
                .json({
                    error:
                        "SEO page error"
                });
        }
    }
);

export default router;