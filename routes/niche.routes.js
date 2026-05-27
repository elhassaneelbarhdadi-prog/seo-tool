import express from "express";
import rateLimit from "express-rate-limit";

import {
    generateNichesAI
} from "../services/niche.service.js";

import {
    authMiddleware
} from "../middleware/auth.middleware.js";

import {
    usageMiddleware
} from "../middleware/usage.middleware.js";

import db from "../config/database.js";

const router = express.Router();

/* ========================= */
/* LIMIT */
/* ========================= */

const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
});

const MAX_KEYWORD = 100;

/* ========================= */
/* DEV LOGS */
/* ========================= */

if (process.env.NODE_ENV === "development") {

    router.use((req, res, next) => {

        console.log(
            "📡 NICHES:",
            req.method,
            req.originalUrl
        );

        next();

    });

}

/* ========================= */
/* GENERATE */
/* ========================= */

router.post(

    "/generate",

    authMiddleware,

    usageMiddleware("ai"),

    aiLimiter,

    async (req, res) => {

        try {

            const userId = req.user?.id;

            if (!userId) {

                return res.status(401).json({
                    error: "Unauthorized"
                });

            }

            const plan = String(
                req.user?.plan || "FREE"
            ).toUpperCase();

            /* ========================= */
            /* INPUT */
            /* ========================= */

            const keyword = String(
                req.body?.keyword || ""
            )
                .trim()
                .toLowerCase()
                .replace(/\s+/g, " ")
                .slice(0, MAX_KEYWORD);

            if (!keyword) {

                return res.status(400).json({
                    error: "Keyword required"
                });

            }

            if (keyword.length < 2) {

                return res.status(400).json({
                    error: "Keyword too short"
                });

            }

            /* ========================= */
            /* AI */
            /* ========================= */

            let niches =
                await generateNichesAI(keyword);

            if (!Array.isArray(niches)) {
                niches = [];
            }

            /* ========================= */
            /* CLEAN */
            /* ========================= */

            niches = niches
                .filter(n => n?.keyword)
                .map(n => ({
                    keyword: String(n.keyword || "")
                        .trim()
                        .slice(0, 100),

                    potentiel: String(
                        n.potentiel || "moyen"
                    ),

                    business: String(
                        n.business || "SEO"
                    ).slice(0, 100)
                }))
                .slice(0, 20);

            /* ========================= */
            /* TRACK */
            /* ========================= */
            console.log("🔥 USER:", req.user);
            console.log("🔥 KEYWORD:", keyword);
            console.log("🔥 NICHES:", niches);
            await db.run(
                `
                INSERT INTO ai_usage(
                    user_id,
                    message
                )
                VALUES(?,?)
                `,
                [
                    userId,
                    `niches:${keyword}`
                ]
            );

            /* ========================= */
            /* FREE */
            /* ========================= */

            if (plan === "FREE") {

                return res.json({

                    success: true,

                    limited: true,

                    upgrade: true,

                    niches: niches.slice(0, 3)

                });

            }

            /* ========================= */
            /* PAID */
            /* ========================= */

            return res.json({

                success: true,

                limited: false,

                niches

            });

        }

        catch (error) {

            console.error(
                "🔥 NICHES FULL ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    error?.message ||
                    "Niches generation failed"

            });

        }

    }

);

/* ========================= */
/* DEV HEALTH */
/* ========================= */

if (process.env.NODE_ENV === "development") {

    router.get(

        "/health",

        (req, res) => {

            res.json({

                ok: true,

                service: "niches"

            });

        }

    );

}

export default router;