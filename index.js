import "./config/env.js";

import fs from "fs";
import express from "express";
import cors from "cors";

/* DEBUG (DEV ONLY) */
if (process.env.NODE_ENV === "development") {
    console.log("📁 .env exists:", fs.existsSync("./.env"));
}

/* ROUTES */
import authRoutes from "./routes/auth.routes.js";
import keywordRoutes from "./routes/keyword.routes.js";
import seoRoutes from "./routes/seo.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import stripeRoutes from "./routes/stripe.routes.js";
import nicheRoutes from "./routes/niche.routes.js";
import plansRoutes from "./routes/plans.routes.js";
import devRoutes from "./routes/dev.routes.js";
import businessRoutes from "./routes/businessProfile.routes.js";
import seoPageRoutes from "./routes/seoPage.routes.js";
const app = express();
const PORT = 3001;

/* ========================= */
/* 🌍 CONFIG */
/* ========================= */
const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";

/* ========================= */
/* 🔥 CORS */
/* ========================= */
app.use(cors({
    origin: FRONT_URL,
    credentials: true
}));

/* ========================= */
/* 🔥 JSON */
/* ========================= */
app.use(express.json());

/* ========================= */
/* 🌍 ROUTES */
/* ========================= */

// 👉 AUTH
app.use("/api/auth", authRoutes);

// 👉 KEYWORDS
app.use("/api/keyword", keywordRoutes);

// 👉 SEO
app.use("/api/seo", seoRoutes); // ✅ FIX ICI

// 👉 SEO PAGE
app.use("/api/seo-page", seoPageRoutes);

// 👉 AUTRES
app.use("/api/plans", plansRoutes);
app.use("/api/business-profile", businessRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/niche", nicheRoutes);
app.use("/api/stripe", stripeRoutes);
/* ========================= */
/* 🧪 DEV */
/* ========================= */
if (process.env.NODE_ENV === "development") {
    app.use("/api/dev", devRoutes);
}

/* ========================= */
/* ROOT */
/* ========================= */
app.get("/", (req, res) => {
    res.send("🚀 SEO SaaS API running");
});

/* ========================= */
/* 🔥 SITEMAP */
/* ========================= */
app.get("/sitemap.xml", (req, res) => {

    const BASE_URL = FRONT_URL;

    const cities = ["paris", "lyon", "marseille"];
    const jobs = ["plombier", "coiffeur", "coach-sportif"];
    const langs = ["fr", "en"];

    let urls = "";

    langs.forEach(lang => {
        cities.forEach(city => {
            jobs.forEach(job => {
                urls += `
                <url>
                    <loc>${BASE_URL}/${lang}/annuaire/${job}-${city}</loc>
                    <changefreq>weekly</changefreq>
                    <priority>0.8</priority>
                </url>`;
            });
        });
    });

    langs.forEach(lang => {
        urls += `
        <url>
            <loc>${BASE_URL}/${lang}</loc>
            <changefreq>daily</changefreq>
            <priority>1.0</priority>
        </url>`;
    });

    res.set("Content-Type", "application/xml");

    res.send(`
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${urls}
        </urlset>
    `);
});

/* ========================= */
/* 🔥 ROBOTS */
/* ========================= */
app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`
User-agent: *
Allow: /

Sitemap: ${FRONT_URL}/sitemap.xml
    `);
});

/* ========================= */
/* 404 */
/* ========================= */
app.use((req, res) => {
    console.log("❌ 404 HIT:", req.method, req.originalUrl);
    res.status(404).json({
        error: "Route not found",
        path: req.originalUrl
    });
});

/* ========================= */
/* ERROR */
/* ========================= */
app.use((err, req, res, next) => {
    console.error("🔥 GLOBAL ERROR:", err);
    res.status(500).json({
        error: "Internal server error"
    });
});

/* ========================= */
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});