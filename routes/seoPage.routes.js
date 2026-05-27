import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import db from "../config/database.js";

const router =
    express.Router();

/* ========================= */
/* OPENAI */
/* ========================= */

if (
    !process.env.OPENAI_API_KEY
) {

    throw new Error(
        "OPENAI_API_KEY missing"
    );

}

const openai =
    new OpenAI({

        apiKey:
            process.env.OPENAI_API_KEY

    });

const MAX_SLUG = 100;

/* ========================= */
/* LIMIT */
/* ========================= */

const limiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 30,

        standardHeaders: true,

        legacyHeaders: false

    });

/* ========================= */
/* DETERMINISTIC */
/* ========================= */

function hash(str) {

    let h = 0;

    for (
        let i = 0;
        i < str.length;
        i++
    ) {

        h =
            str.charCodeAt(i)
            +
            ((h << 5) - h);

    }

    return Math.abs(h);

}

function random(seed) {

    const x =
        Math.sin(seed)
        * 10000;

    return x -
        Math.floor(x);

}

function generateTrend(
    slug
) {

    const seed =
        hash(slug);

    const base =

        200 +

        Math.floor(
            random(seed)
            * 500
        );

    return Array
        .from(

            { length: 12 },

            (_, i) => {

                const growth =
                    i *
                    (
                        random(seed + i)
                        * 15
                    );

                const season =

                    Math.sin(
                        (i / 12)
                        * Math.PI * 2
                    )
                    * 100;

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
/* PARSE */
/* ========================= */

function parseSlug(
    slug
) {

    const knownCities = [

        "paris",
        "lyon",
        "marseille",
        "toulouse",
        "nice",
        "nantes",
        "lille",
        "bordeaux",
        "strasbourg",
        "montpellier",
        "saint-etienne"

    ];

    let parts =
        slug.split("-");

    const lastTwo =

        parts
            .slice(-2)
            .join("-");

    let city = null;

    if (
        knownCities.includes(
            lastTwo
        )
    ) {

        city =
            lastTwo;

        parts =
            parts.slice(
                0,
                -2
            );

    } else {

        city =
            parts.pop();

    }

    return {

        keyword:

            parts.join(" ")
            ||
            "business",

        city:
            city
            ||
            "france"

    };

}

/* ========================= */
/* CONTENT */
/* ========================= */

async function generateContent(
    slug
) {

    const {
        keyword,
        city
    } = parseSlug(
        slug
    );

    const prompt = `

Rédige une page SEO française.

Keyword:
${keyword}

Ville:
${city}

Structure:

H1

Introduction

3 H2

Conclusion

Style naturel.
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
                    700

            });

    return (

        result
            .choices?.[0]
            ?.message
            ?.content

        ||

        ""

    );

}

/* ========================= */
/* ANTI DOUBLE */
/* ========================= */

const generating =
    new Set();

/* ========================= */
/* GET PAGE */
/* ========================= */

router.get(

    "/",

    limiter,

    async (
        req,
        res
    ) => {

        try {

            const slug =

                String(

                    req.query.slug
                    ||
                    ""

                )

                    .toLowerCase()

                    .normalize(
                        "NFD"
                    )

                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )

                    .replace(
                        /[^a-z0-9-\s]/g,
                        ""
                    )

                    .replace(
                        /\s+/g,
                        "-"
                    )

                    .slice(
                        0,
                        MAX_SLUG
                    );

            if (
                !slug
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Invalid slug"

                    });

            }

            let page =

                await db.get(

                    `

SELECT

slug,

title,

content,

volume,

trend

FROM seo_pages

WHERE slug=?

LIMIT 1

`,

                    [slug]

                );

            if (
                !page
            ) {

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

                    const title =

                        slug
                            .replaceAll(
                                "-",
                                " "
                            );

                    const content =

                        await generateContent(
                            slug
                        );

                    const trend =

                        generateTrend(
                            slug
                        );

                    const volume =

                        trend.reduce(
                            (a, b) => a + b,
                            0
                        );

                    await db.run(

                        `

INSERT INTO
seo_pages(

slug,

title,

content,

volume,

trend

)

VALUES(

?,

?,

?,

?,

?

)

`,

                        [

                            slug,

                            title,

                            content,

                            volume,

                            JSON.stringify(
                                trend
                            )

                        ]

                    );

                    page = {

                        slug,

                        title,

                        content,

                        volume,

                        trend

                    };

                }
                finally {

                    generating
                        .delete(
                            slug
                        );

                }

            }

            if (
                typeof page.trend
                === "string"
            ) {

                try {

                    page.trend =

                        JSON.parse(
                            page.trend
                        );

                }
                catch {

                    page.trend = [];

                }

            }

            return res.json({

                success: true,

                page

            });

        }

        catch (error) {

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