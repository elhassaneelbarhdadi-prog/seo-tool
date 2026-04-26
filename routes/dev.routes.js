import express from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* 🔥 RESET USAGE (DEV) */
/* ========================= */

router.post("/reset-usage", authMiddleware, async (req, res) => {

    try {

        const userId = req.user.id;

        await db.run(`
            DELETE FROM ai_usage WHERE user_id = ?
        `, [userId]);

        res.json({
            message: "✅ Usage reset avec succès"
        });

    } catch (error) {

        console.error("RESET ERROR:", error);

        res.status(500).json({
            error: "Reset error"
        });

    }

});

export default router;