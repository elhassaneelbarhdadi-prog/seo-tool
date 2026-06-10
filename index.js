import "./config/env.js";

import fs from "fs";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import googleAdsTest from "./routes/googleads.test.js";

/* ========================= */
/* ROUTES */
/* ========================= */

import stripeWebhookRoutes
    from "./routes/stripeWebhook.routes.js";

import stripeRoutes
    from "./routes/stripe.routes.js";

import authRoutes
    from "./routes/auth.routes.js";

import keywordRoutes
    from "./routes/keyword.routes.js";

import seoRoutes
    from "./routes/seo.routes.js";

import seoPageRoutes
    from "./routes/seoPage.routes.js";

import chatRoutes
    from "./routes/chat.routes.js";

import nicheRoutes
    from "./routes/niche.routes.js";

import plansRoutes
    from "./routes/plans.routes.js";

import devRoutes
    from "./routes/dev.routes.js";

import businessRoutes
    from "./routes/businessProfile.routes.js";

/* ========================= */
/* INIT */
/* ========================= */

const app = express();

const PORT =
    process.env.PORT || 3001;

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
    "http://localhost:5173";

/* ========================= */
/* RATE LIMIT */
/* ========================= */

app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100
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

app.use(
    "/api/stripe",
    stripeWebhookRoutes
);

/* ========================= */
/* JSON PARSER */
/* ========================= */

app.use(
    express.json({
        limit: "2mb"
    })
);

/* ========================= */
/* DEBUG JSON */
/* ========================= */

app.use((req, res, next) => {

    if (
        process.env.NODE_ENV === "development"
    ) {

        console.log(
            "JSON PARSER:",
            req.method,
            req.originalUrl,
            req.body
        );

    }

    next();

});

/* ========================= */
/* STRIPE ROUTES */
/* CHECKOUT ETC */
/* APRÈS express.json() */
/* ========================= */

app.use(
    "/api/stripe",
    stripeRoutes
);

/* ========================= */
/* AUTRES ROUTES */
/* ========================= */

app.use(
    "/api/auth",
    authRoutes
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
/* SITEMAP */
/* ========================= */

app.get(
    "/sitemap.xml",
    async (req, res) => {

        const BASE_URL =
            FRONT_URL;

        const cities = [
            "paris",
            "lyon",
            "marseille"
        ];

        const jobs = [
            "plombier",
            "coiffeur",
            "coach-sportif"
        ];

        const langs = [
            "fr",
            "en"
        ];

        let urls = "";

        for (const lang of langs) {

            for (const city of cities) {

                for (const job of jobs) {

                    urls += `
<url>
    <loc>${BASE_URL}/${lang}/annuaire/${job}-${city}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
</url>`;

                }

            }

        }

        res.set(
            "Content-Type",
            "application/xml"
        );

        res.send(`
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);

    }
);

/* ========================= */
/* ROBOTS */
/* ========================= */

app.get(
    "/robots.txt",
    (req, res) => {

        res.type("text/plain");

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

        res.status(404).json({

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
    (err, req, res, next) => {

        console.error(
            "🔥 ERROR:",
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

app.listen(PORT, () => {

    console.log(
        `🚀 Server running on port ${PORT}`
    );

});