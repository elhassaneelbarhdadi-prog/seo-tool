import "./config/env.js";

import adminRoutes from "./routes/admin.routes.js";
import fs from "fs";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import googleAdsTest from "./routes/googleads.test.js";
import stripeRoutes from "./routes/stripe.routes.js";
import billingWebhookRoutes from "./routes/billing.webhook.js";
import authRoutes from "./routes/auth.routes.js";
import keywordRoutes from "./routes/keyword.routes.js";
import seoRoutes from "./routes/seo.routes.js";
import seoPageRoutes from "./routes/seoPage.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import nicheRoutes from "./routes/niche.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import devRoutes from "./routes/dev.routes.js";
import businessRoutes from "./routes/businessProfile.routes.js";

import db from "./config/database.js";


/* ========================================================= */
/* APP */
/* ========================================================= */

const app = express();


/* ========================================================= */
/* RENDER / PROXY */
/* ========================================================= */

app.set("trust proxy", 1);

const PORT =
    process.env.PORT || 3001;


/* ========================================================= */
/* ENV DEBUG */
/* ========================================================= */

if (
    process.env.NODE_ENV === "development"
) {

    console.log(
        "📁 .env exists:",
        fs.existsSync("./.env")
    );

}


/* ========================================================= */
/* FRONTEND URL */
/* ========================================================= */

const FRONT_URL =
    process.env.FRONT_URL ||
    "https://www.referenciaseo.com";


/* ========================================================= */
/* RATE LIMIT */
/* ========================================================= */

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
    })
);


/* ========================================================= */
/* CORS */
/* ========================================================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


/* ========================================================= */
/* STRIPE WEBHOOK */
/* IMPORTANT :
   doit être déclaré avant express.json()
*/
/* ========================================================= */

console.log(
    "🔥 REGISTERING BILLING WEBHOOK ROUTES"
);

app.use(
    "/api/stripe",
    billingWebhookRoutes
);


/* ========================================================= */
/* JSON PARSER */
/* ========================================================= */

app.use(
    express.json()
);


/* ========================================================= */
/* REQUEST LOG */
/* ========================================================= */

app.use(
    (req, res, next) => {

        console.log(
            "📦 JSON PARSER:",
            req.method,
            req.originalUrl,
            req.body
        );

        next();
    }
);


/* ========================================================= */
/* API ROUTES */
/* ========================================================= */

app.use(
    "/api/stripe",
    stripeRoutes
);


app.use(
    "/api/auth",
    authRoutes
);


console.log(
    "✅ ADMIN ROUTES REGISTERED"
);


app.use(
    "/api/admin",
    adminRoutes
);


app.use(
    "/api/keyword",
    keywordRoutes
);


app.use(
    "/api/seo",
    seoRoutes
);


app.use(
    "/api/seo-page",
    seoPageRoutes
);


app.use(
    "/api/chat",
    chatRoutes
);


app.use(
    "/api/niche",
    nicheRoutes
);


app.use(
    "/api/plans",
    plansRoutes
);


app.use(
    "/api/test",
    googleAdsTest
);


app.use(
    "/api/business-profile",
    businessRoutes
);


/* ========================================================= */
/* DEVELOPMENT ROUTES */
/* ========================================================= */

if (
    process.env.NODE_ENV === "development"
) {

    app.use(
        "/api/dev",
        devRoutes
    );

}


/* ========================================================= */
/* ROOT */
/* ========================================================= */

app.get(
    "/",
    (req, res) => {

        res.send(
            "🚀 SEO SaaS API running"
        );

    }
);


/* ========================================================= */
/* SITEMAP.XML */
/* ========================================================= */

app.get(
    "/sitemap.xml",
    async (req, res) => {

        try {

            /* ================================================= */
            /* BASE URL */
            /* ================================================= */

            const BASE_URL = (
                FRONT_URL ||
                "https://www.referenciaseo.com"
            ).replace(
                /\/$/,
                ""
            );


            /* ================================================= */
            /* NORMALIZE SLUG */
            /* ================================================= */

            const normalizeSlug = (
                value = ""
            ) => {

                return String(value)
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )
                    .toLowerCase()
                    .trim()
                    .replace(
                        /[^a-z0-9]+/g,
                        "-"
                    )
                    .replace(
                        /^-+|-+$/g,
                        "");

            };


            /* ================================================= */
            /* XML ESCAPE */
            /* ================================================= */

            const escapeXml = (
                value = ""
            ) => {

                return String(value)
                    .replace(
                        /&/g,
                        "&amp;"
                    )
                    .replace(
                        /</g,
                        "&lt;"
                    )
                    .replace(
                        />/g,
                        "&gt;"
                    )
                    .replace(
                        /"/g,
                        "&quot;"
                    )
                    .replace(
                        /'/g,
                        "&apos;"
                    );

            };


            /* ================================================= */
            /* STATIC URLS */
            /* ================================================= */

            const staticUrls = [

                `${BASE_URL}/fr/`,

                `${BASE_URL}/fr/free-analyzer`,

                `${BASE_URL}/fr/annuaire/`,

                `${BASE_URL}/fr/pricing`

            ];


            /* ================================================= */
            /* GET REAL CITIES */
            /* FROM BUSINESS_PROFILES */
            /* ================================================= */

            const cityRows =
                await db.all(`
                    SELECT DISTINCT city
                    FROM business_profiles
                    WHERE city IS NOT NULL
                    AND TRIM(city) != ''
                `);


            /* ================================================= */
            /* VALID CITY SET */
            /* ================================================= */

            const validCities =
                new Set();


            for (
                const row
                of cityRows || []
            ) {

                const city =
                    String(
                        row.city || ""
                    ).trim();


                const citySlug =
                    normalizeSlug(
                        city
                    );


                if (
                    citySlug
                ) {

                    validCities.add(
                        citySlug
                    );

                }

            }


            /* ================================================= */
            /* GET SEO PAGES */
            /* ================================================= */

            const seoPages =
                await db.all(`
                    SELECT
                        slug,
                        keyword,
                        city,
                        created_at
                    FROM seo_pages
                    WHERE slug IS NOT NULL
                    AND TRIM(slug) != ''
                    AND keyword IS NOT NULL
                    AND TRIM(keyword) != ''
                    AND city IS NOT NULL
                    AND TRIM(city) != ''
                    ORDER BY created_at DESC
                `);


            /* ================================================= */
            /* BUILD URL LIST */
            /* ================================================= */

            const urls = [];


            /* ================================================= */
            /* DUPLICATE PROTECTION */
            /* ================================================= */

            const seen =
                new Set();


            /* ================================================= */
            /* COUNTERS */
            /* ================================================= */

            let excludedPages = 0;

            let includedSeoPages = 0;


            /* ================================================= */
            /* STATIC PAGES */
            /* ================================================= */

            for (
                const url
                of staticUrls
            ) {

                urls.push(`
<url>
    <loc>${escapeXml(url)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
</url>`);

            }


            /* ================================================= */
            /* SEO PAGES */
            /* ================================================= */

            for (
                const page
                of seoPages || []
            ) {

                const rawSlug =
                    String(
                        page.slug || ""
                    ).trim();


                const rawKeyword =
                    String(
                        page.keyword || ""
                    ).trim();


                const rawCity =
                    String(
                        page.city || ""
                    ).trim();


                /* --------------------------------------------- */
                /* REQUIRED DATA */
                /* --------------------------------------------- */

                if (
                    !rawSlug ||
                    !rawKeyword ||
                    !rawCity
                ) {

                    excludedPages++;

                    continue;
                }


                /* --------------------------------------------- */
                /* NORMALIZE CITY */
                /* --------------------------------------------- */

                const citySlug =
                    normalizeSlug(
                        rawCity
                    );


                if (!citySlug) {

                    excludedPages++;

                    continue;
                }


                /* --------------------------------------------- */
                /* CITY MUST EXIST IN BUSINESS_PROFILES */
                /* --------------------------------------------- */

                if (
                    !validCities.has(
                        citySlug
                    )
                ) {

                    excludedPages++;

                    continue;
                }


                /* --------------------------------------------- */
                /* NORMALIZE PAGE SLUG */
                /* --------------------------------------------- */

                const pageSlug =
                    normalizeSlug(
                        rawSlug
                    );


                if (!pageSlug) {

                    excludedPages++;

                    continue;
                }


                /* --------------------------------------------- */
                /* SLUG MUST END WITH CITY */
                /* --------------------------------------------- */

                if (
                    !pageSlug.endsWith(
                        `-${citySlug}`
                    )
                ) {

                    excludedPages++;

                    continue;
                }


                /* --------------------------------------------- */
                /* REMOVE DUPLICATES */
                /* --------------------------------------------- */

                if (
                    seen.has(
                        pageSlug
                    )
                ) {

                    excludedPages++;

                    continue;
                }


                seen.add(
                    pageSlug
                );


                /* --------------------------------------------- */
                /* FINAL URL */
                /* --------------------------------------------- */

                const url =
                    `${BASE_URL}/fr/annuaire/${encodeURIComponent(
                        pageSlug
                    )}`;


                urls.push(`
<url>
    <loc>${escapeXml(url)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
</url>`);


                includedSeoPages++;

            }


            /* ================================================= */
            /* FINAL XML */
            /* ================================================= */

            const xml =
                `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;


            /* ================================================= */
            /* SITEMAP LOG */
            /* ================================================= */

            console.log(
                "🗺️ SITEMAP GENERATED:",
                {
                    staticPages:
                        staticUrls.length,

                    seoPagesFound:
                        seoPages.length,

                    seoPagesIncluded:
                        includedSeoPages,

                    excludedPages,

                    totalPages:
                        urls.length,

                    validCities:
                        validCities.size
                }
            );


            /* ================================================= */
            /* RESPONSE */
            /* ================================================= */

            res
                .status(200)
                .type("application/xml")
                .send(xml);


        } catch (error) {

            console.error(
                "❌ SITEMAP ERROR:",
                error
            );


            res
                .status(500)
                .type("text/plain")
                .send(
                    "Erreur lors de la génération du sitemap"
                );

        }

    }
);


/* ========================================================= */
/* ROBOTS.TXT */
/* ========================================================= */

app.get(
    "/robots.txt",
    (req, res) => {

        res.type(
            "text/plain"
        );


        res.send(
            `User-agent: *
Allow: /
Sitemap: ${FRONT_URL}/sitemap.xml`
        );

    }
);


/* ========================================================= */
/* 404 */
/* ========================================================= */

app.use(
    (req, res) => {

        console.log(
            "❌ 404:",
            req.method,
            req.originalUrl
        );


        res
            .status(404)
            .json({

                error:
                    "Route not found",

                path:
                    req.originalUrl

            });

    }
);


/* ========================================================= */
/* ERROR HANDLER */
/* ========================================================= */

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "🔥 ERROR:"
        );

        console.error(
            err
        );


        res
            .status(
                err.status || 500
            )
            .json({

                error:
                    err.message ||
                    "Internal server error"

            });

    }
);


/* ========================================================= */
/* START SERVER */
/* ========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server running on port ${PORT}`
        );

    }
);