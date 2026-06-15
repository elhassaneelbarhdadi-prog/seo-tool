import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import geoip from "geoip-lite";
import axios from "axios";
import { analyzeSEO } from "../controllers/seo.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import db from "../config/database.js";
console.log("✅ SEO ROUTES LOADED");
const router = express.Router();
/* ========================= */
/* SERPER API */
/* ========================= */

async function searchGoogle(keyword) {

    try {

        const response = await axios.post(

            "https://google.serper.dev/search",

            {
                q: keyword,
                gl: "fr",
                hl: "fr"
            },

            {
                headers: {

                    "X-API-KEY":
                        process.env.SERPER_API_KEY,

                    "Content-Type":
                        "application/json"

                }
            }

        );

        return response.data;

    }

    catch (error) {

        console.error(

            "SERPER ERROR:",

            error.response?.data
            ||
            error.message

        );

        throw error;

    }

}
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
/* DETERMINISTIC TREND */
/* ========================= */

function hash(s) {

    let h = 0;

    for (
        let i = 0;
        i < s.length;
        i++
    ) {

        h =
            s.charCodeAt(i)
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

function generateTrend(volume = 1000) {

    const trend = [];

    let currentValue =
        volume * 0.75;

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const variation =

            Math.floor(
                Math.random() * 150
            );

        currentValue += variation;

        if (
            currentValue > volume
        ) {

            currentValue = volume;

        }

        trend.push(
            Math.round(currentValue)
        );

    }

    return trend;

}

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
/* ANALYZE */
/* ========================= */

router.post(

    "/analyze",

    limiter,

    analyzeSEO

);
/* ========================= */
/* CITY */
/* ========================= */

function getUserCity(
    req
) {

    try {

        const ip =

            req.headers[
                "x-forwarded-for"
            ]

                ?.split(",")[0]

            ||

            req.ip

            ||

            req.socket
                ?.remoteAddress;

        if (

            !ip
            ||

            ip === "::1"

            ||

            ip.includes(
                "127.0.0.1"
            )

        ) {

            return null;

        }

        const geo =
            geoip.lookup(ip);

        return geo?.city
            ?.toLowerCase()

            || null;

    }

    catch {

        return null;

    }

}

/* ========================= */
/* AI */
/* ========================= */

async function generateContentAI(
    slug,
    city
) {

    const keyword =

        slug
            .replaceAll(
                "-",
                " "
            );

    const prompt = `

Rédige une page SEO française.

Mot-clé:
${keyword}

Localisation:
${city || "France"}

Structure:

H1

Introduction

3 H2

Conclusion

Style naturel.

`;

    const res =

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

        res.choices?.[0]
            ?.message
            ?.content

        ||

        ""

    );

}
router.post(
    "/free-analyze",
    limiter,
    analyzeSEO
);
/* ========================= */
/* PAGE */
/* ========================= */

router.get(

    "/seo-page",

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

                const city =
                    getUserCity(
                        req
                    );

                const title =

                    slug
                        .replaceAll(
                            "-",
                            " "
                        );

                const content =

                    await generateContentAI(
                        slug,
                        city
                    );

                const volume =

                    Math.floor(
                        2000 +
                        Math.random() * 2000
                    );

                const trend =
                    generateTrend(volume);

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
console.log("✅ FREE ANALYZE ROUTE REGISTERED");
/* ========================= */
/* GOOGLE SEARCH */
/* ========================= */

router.get(

    "/search-google",

    limiter,

    async (req, res) => {

        try {

            const { keyword } =
                req.query;

            if (!keyword) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Keyword requis"

                    });

            }

            const data =
                await searchGoogle(keyword);

            return res.json({

                success: true,

                organic:
                    data.organic || [],

                peopleAlsoAsk:
                    data.peopleAlsoAsk || [],

                relatedSearches:
                    data.relatedSearches || []

            });

        }

        catch (error) {

            console.error(error);

            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "SERPER API ERROR"

                });

        }

    }

);
export default router;