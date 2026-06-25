import express from "express";
import rateLimit from "express-rate-limit";
import axios from "axios";
import { analyzeSEO } from "../controllers/seo.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { usageMiddleware } from "../middleware/usage.middleware.js";

console.log("✅ SEO ROUTES LOADED");

const router = express.Router();

/* ========================= */
/* LIMITER */
/* ========================= */

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
});

/* ========================= */
/* FREE LIMITER */
/* 5 essais / IP / jour */
/* ========================= */

const freeAnalyzeLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "FREE_LIMIT_REACHED",
        message: "Limite gratuite atteinte",
        limit: 5,
        upgrade: true
    }
});

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
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "SERPER ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
}

/* ========================= */
/* ANALYZE */
/* ========================= */

/*
🔒 Route privée :
- nécessite login
- applique quota user selon le plan
*/
router.post(
    "/analyze",
    async (req, res, next) => {
        console.log("🔥 ROUTE ANALYZE HIT");
        next();
    },
    authMiddleware,
    usageMiddleware("keywords"),
    analyzeSEO
);

/*
🌍 Route publique :
- pas de login
- 5 essais gratuits max / jour / IP
- pas d'historique user si non connecté
*/
router.post(
    "/free-analyze",
    freeAnalyzeLimiter,
    analyzeSEO
);

/* ========================= */
/* PING */
/* ========================= */

router.get("/ping", (req, res) => {
    res.json({
        success: true,
        route: "seo.routes.js"
    });
});

/* ========================= */
/* GOOGLE SEARCH (LEGACY) */
/* ========================= */

router.get(
    "/search-google",
    limiter,
    async (req, res) => {
        try {
            const keyword = String(req.query.keyword || "").trim();

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    error: "Keyword requis"
                });
            }

            const data = await searchGoogle(keyword);

            return res.json({
                success: true,
                organic: data.organic || [],
                peopleAlsoAsk: data.peopleAlsoAsk || [],
                relatedSearches: data.relatedSearches || []
            });
        } catch (error) {
            console.error("SEARCH GOOGLE ERROR:", error);

            return res.status(500).json({
                success: false,
                error: "SERPER API ERROR"
            });
        }
    }
);

/* ========================= */
/* ORGANIC RESULTS */
/* ========================= */

router.get(
    "/organic",
    limiter,
    async (req, res) => {
        try {
            const keyword = String(req.query.keyword || "").trim();

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    error: "Keyword requis"
                });
            }

            const data = await searchGoogle(keyword);

            return res.json({
                success: true,
                organic: data.organic || []
            });
        } catch (error) {
            console.error(
                "ORGANIC ERROR:",
                error.response?.data || error.message
            );

            return res.status(500).json({
                success: false,
                error: "Erreur récupération résultats Google"
            });
        }
    }
);

export default router;