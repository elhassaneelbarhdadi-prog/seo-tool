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

/*
 * Les villes sont récupérées directement
 * depuis business_profiles.
 *
 * Exemple :
 *
 * keyword : hijama
 * city    : Guesnain
 *
 * slug :
 * hijama-guesnain
 *
 * devient :
 *
 * keyword : hijama
 * city    : guesnain
 */

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

    /*
     * Transformation des villes en slugs.
     *
     * Exemple :
     * "Saint-Étienne"
     * devient :
     * "saint-etienne"
     */
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
        /*
         * Les villes les plus longues
         * sont testées en premier.
         *
         * Important pour :
         * saint-etienne
         * villeneuve-d-ascq
         * etc.
         */
        .sort(
            (a, b) =>
                b.slug.length -
                a.slug.length
        );

    /*
     * Recherche d'une ville à la fin du slug.
     */
    for (const city of cities) {

        /*
         * Cas où le slug est uniquement
         * constitué du nom de la ville.
         */
        if (
            cleanSlug === city.slug
        ) {
            return {
                keyword: "business",
                city: city.slug
            };
        }

        /*
         * Cas normal :
         *
         * hijama-guesnain
         *
         * → hijama
         * → guesnain
         */
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

    /*
     * FALLBACK
     *
     * Si la ville n'existe pas encore
     * dans business_profiles, on considère
     * le dernier segment comme la ville.
     */
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
/* 🤖 CONTENT GENERATION */
/* ========================= */

async function generateContent(slug) {

    const {
        keyword,
        city
    } =
        await parseSlug(slug);

    const prompt = `
Rédige une page SEO française utile,
naturelle et originale.

Mot-clé :
${keyword}

Ville :
${city}

La page doit être réellement utile
aux internautes qui recherchent ce
service dans cette ville.

Structure :

H1

Introduction

H2 : Présentation du service

H2 : Pourquoi choisir un professionnel à ${city}

H2 : Comment choisir un professionnel

Conclusion

Style naturel, professionnel et
informatif.

Ne pas inventer de statistiques,
de coordonnées ou d'avis.

Évite le bourrage de mots-clés.
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
                    900

            });

    return (
        result
            .choices?.[0]
            ?.message
            ?.content ||
        ""
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

                /*
                 * Empêche plusieurs requêtes
                 * simultanées de générer
                 * la même page.
                 */
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

                    /*
                     * Score interne.
                     */
                    const score =
                        Math.min(
                            100,
                            Math.round(
                                volume / 100
                            )
                        );

                    /*
                     * Valeurs par défaut.
                     *
                     * Elles pourront être
                     * remplacées par les
                     * vraies données SEO
                     * lorsque disponibles.
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
                 * Ta base n'a pas de colonne
                 * competition, donc on utilise
                 * difficulty comme valeur
                 * compatible.
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