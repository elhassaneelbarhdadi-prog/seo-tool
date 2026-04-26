import express from "express";
import { generateNichesAI } from "../services/niche.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/generate",
    authMiddleware,
    async (req, res) => {
        try {
            const { keyword } = req.body;
            const user = req.user;
            const plan = user?.plan || "FREE";

            /* ========================= */
            /* 🔒 VALIDATION */
            /* ========================= */

            if (!keyword || typeof keyword !== "string") {
                return res.status(400).json({
                    error: "Keyword invalide"
                });
            }

            const cleanKeyword = keyword.trim().toLowerCase();

            if (cleanKeyword.length < 2) {
                return res.status(400).json({
                    error: "Keyword trop court"
                });
            }

            /* ========================= */
            /* 🤖 GENERATE */
            /* ========================= */

            const niches = await generateNichesAI(cleanKeyword);

            if (!Array.isArray(niches)) {
                console.warn("⚠️ NICHES INVALID FORMAT:", niches);
                return res.json({ success: true, niches: [] });
            }

            /* ========================= */
            /* 🔥 PLAN LOGIC */
            /* ========================= */

            if (plan === "FREE") {
                return res.json({
                    success: true,
                    niches: niches.slice(0, 3), // 🔥 LIMIT 3
                    limited: true,
                    upgrade: true
                });
            }

            /* ========================= */
            /* ✅ PRO / BUSINESS */
            /* ========================= */

            return res.json({
                success: true,
                niches
            });

        } catch (error) {
            console.error("🔥 NICHES ERROR:", error);

            return res.status(500).json({
                success: false,
                error: "Erreur génération niches"
            });
        }
    }
);

export default router;