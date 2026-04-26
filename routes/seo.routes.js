import express from "express";
import { analyzeSEO } from "../controllers/seo.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import db from "../config/database.js"; // 👈 AJOUT

const router = express.Router();

console.log("🔥 SEO ROUTES LOADED");

/* ========================= */
/* 🚀 ANALYZE */
/* ========================= */
router.post("/analyze", authMiddleware, analyzeSEO);

/* ========================= */
/* 🔍 GET SEO PAGE */
/* ========================= */
router.get("/seo-page", async (req, res) => {
    try {

        const { slug } = req.query;

        if (!slug) {
            return res.status(400).json({
                error: "Slug requis"
            });
        }

        const page = await db.get(`
            SELECT * FROM seo_pages WHERE slug = ?
        `, [slug]);

        if (!page) {
            return res.status(404).json({
                error: "Page non trouvée"
            });
        }

        res.json(page);

    } catch (error) {

        console.error("SEO PAGE ERROR:", error);

        res.status(500).json({
            error: "Erreur serveur"
        });
    }
});

export default router;