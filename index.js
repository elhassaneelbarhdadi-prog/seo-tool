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


const app = express();


/* ========================= */
/* TRUST PROXY */
/* IMPORTANT FOR */
/* RENDER + CLOUDFLARE */
/* ========================= */

app.set("trust proxy", 1);

const PORT =
    process.env.PORT || 3001;


/* ========================= */
/* DEBUG ENV */
/* ========================= */

if (
    process.env.NODE_ENV === "development"
) {
    console.log(
        "📁 .env exists:",
        fs.existsSync("./.env")
    );
}


const FRONT_URL =
    process.env.FRONT_URL ||
    "https://www.referenciaseo.com";


/* ========================= */
/* RATE LIMIT */
/* ========================= */

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
    })
);


/* ========================= */
/* CORS */
/* ========================= */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


/* ========================= */
/* STRIPE WEBHOOK */
/* IMPORTANT */
/* AVANT express.json() */
/* ========================= */

console.log(
    "🔥 REGISTERING BILLING WEBHOOK ROUTES"
);

app.use(
    "/api/stripe",
    billingWebhookRoutes
);


/* ========================= */
/* JSON PARSER */
/* ========================= */

app.use(
    express.json()
);


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


/* ========================= */
/* ROUTES */
/* ========================= */

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


/* ========================= */
/* DEV */
/* ========================= */

if (
    process.env.NODE_ENV === "development"
) {

    app.use(
        "/api/dev",
        devRoutes
    );

}


/* ========================= */
/* ROOT */
/* ========================= */

app.get(
    "/",
    (req, res) => {

        res.send(
            "🚀 SEO SaaS API running"
        );

    }
);


/* ========================= */
/* 🗺️ SITEMAP */
/* PAGES PUBLIQUES + SEO VALIDÉES */
/* ========================= */

app.get(
    "/sitemap.xml",
    async (req, res) => {

        try {

            const BASE_URL = (
                FRONT_URL ||
                "https://www.referenciaseo.com"
            ).replace(
                /\/$/,
                ""
            );


            /* ========================= */
            /* NORMALISATION SLUG */
            /* ========================= */

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


            /* ========================= */
            /* ÉCHAPPEMENT XML */
            /* ========================= */

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


            /* ========================= */
            /* PAGES PUBLIQUES STATIQUES */
            /* ========================= */

            const staticUrls = [

                `${BASE_URL}/fr/`,

                `${BASE_URL}/fr/annuaire/`,

                `${BASE_URL}/fr/pricing`

            ];


            /* ========================= */
            /* VILLES RÉELLEMENT PRÉSENTES */
            /* DANS BUSINESS_PROFILES */
            /* ========================= */

            const cityRows =
                await db.all(`
                    SELECT DISTINCT city
                    FROM business_profiles
                    WHERE city IS NOT NULL
                    AND TRIM(city) != ''
                `);


            const validCities =
                new Map();


            for (
                const row
                of cityRows || []
            ) {

                const originalCity =
                    String(
                        row.city || ""
                    ).trim();


                const citySlug =
                    normalizeSlug(
                        originalCity
                    );


                if (!citySlug) {
                    continue;
                }


                validCities.set(
                    citySlug,
                    originalCity
                );

            }


            /* ========================= */
            /* RÉCUPÉRATION DES PAGES SEO */
            /* ========================= */

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


            /* ========================= */
            /* CONSTRUCTION DES URLS */
            /* ========================= */

            const urls = [];


            const seen =
                new Set();


            let excludedPages = 0;


            /* ========================= */
            /* PAGES STATIQUES */
            /* ========================= */

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


            /* ========================= */
            /* PAGES SEO */
            /* ========================= */

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


                /* ========================= */
                /* DONNÉES OBLIGATOIRES */
                /* ========================= */

                if (
                    !rawSlug ||
                    !rawKeyword ||
                    !rawCity
                ) {

                    excludedPages++;

                    continue;
                }


                /* ========================= */
                /* VILLE RÉELLEMENT EXISTANTE */
                /* ========================= */

                const citySlug =
                    normalizeSlug(
                        rawCity
                    );


                if (
                    !validCities.has(
                        citySlug
                    )
                ) {

                    excludedPages++;

                    continue;
                }


                /* ========================= */
                /* NORMALISATION DU SLUG */
                /* ========================= */

                const pageSlug =
                    normalizeSlug(
                        rawSlug
                    );


                if (!pageSlug) {

                    excludedPages++;

                    continue;
                }


                /* ========================= */
                /* LE SLUG DOIT SE TERMINER */
                /* PAR LA VILLE */
                /* ========================= */

                if (
                    !pageSlug.endsWith(
                        `-${citySlug}`
                    )
                ) {

                    excludedPages++;

                    continue;
                }


                /* ========================= */
                /* VÉRIFICATION DU PROFIL */
                /*
                 * IMPORTANT :
                 *
                 * Une simple recherche utilisateur
                 * ne doit pas automatiquement devenir
                 * une URL SEO du sitemap.
                 *
                 * On exige qu'au moins un véritable
                 * profil d'annuaire corresponde
                 * au mot-clé dans cette ville.
                 */
                /* ========================= */

                const normalizedKeyword =
                    rawKeyword
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        )
                        .trim();


                const matchingProfiles =
                    await db.get(
                        `
                        SELECT id
                        FROM business_profiles
                        WHERE LOWER(TRIM(city))
                            = LOWER(TRIM(?))
                        AND (
                            LOWER(TRIM(keyword))
                                = LOWER(TRIM(?))

                            OR
                            
                            LOWER(
                                COALESCE(
                                    description,
                                    ''
                                )
                            ) LIKE ?
                        )
                        LIMIT 1
                        `,
                        [
                            rawCity,
                            rawKeyword,
                            `%${normalizedKeyword}%`
                        ]
                    );


                if (
                    !matchingProfiles
                ) {

                    excludedPages++;

                    continue;
                }


                /* ========================= */
                /* DÉDOUBLONNAGE */
                /* ========================= */

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


                /* ========================= */
                /* URL FINALE */
                /* ========================= */

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

            }


            /* ========================= */
            /* XML FINAL */
            /* ========================= */

            const xml =
                `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;


            /* ========================= */
            /* LOG SITEMAP */
            /* ========================= */

            console.log(
                "🗺️ SITEMAP GENERATED:",
                {
                    staticPages:
                        staticUrls.length,

                    seoPagesFound:
                        seoPages.length,

                    seoPagesIncluded:
                        urls.length -
                        staticUrls.length,

                    excludedPages,

                    totalPages:
                        urls.length,

                    validCities:
                        validCities.size
                }
            );


            /* ========================= */
            /* RÉPONSE */
            /* ========================= */

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


/* ========================= */
/* 🤖 ROBOTS */
/* ========================= */

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


/* ========================= */
/* 404 */
/* ========================= */

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


/* ========================= */
/* ERROR HANDLER */
/* ========================= */

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


/* ========================= */
/* START */
/* ========================= */

app.listen(
    PORT,
    () => {

        console.log(
            `🚀 Server running on port ${PORT}`
        );

    }
);