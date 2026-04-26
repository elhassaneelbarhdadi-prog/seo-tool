import express from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* CREATE PROFILE (🔒 PRO ONLY) */
/* ========================= */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, description = "", keyword, city } = req.body;
        const userId = req.user.id;

        if (!name || !keyword || !city) {
            return res.status(400).json({ error: "missingFields" });
        }

        const user = await db.get(
            "SELECT plan FROM users WHERE id = ?",
            [userId]
        );

        if (!user || user.plan === "FREE") {
            return res.status(403).json({ error: "upgradeRequired" });
        }

        const existing = await db.get(
            "SELECT id FROM business_profiles WHERE user_id = ?",
            [userId]
        );

        if (existing) {
            return res.json({ alreadyExists: true });
        }

        const baseScore = Math.floor(Math.random() * 20) + 70;

        let bonus = 0;
        if (description.length > 120) bonus += 5;
        if (keyword.split(" ").length >= 2) bonus += 5;

        const score = Math.min(baseScore + bonus, 100);

        await db.run(
            `INSERT INTO business_profiles 
            (user_id, name, description, keyword, city, score)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, name, description, keyword, city, score]
        );

        res.json({ success: true, score });

    } catch (err) {
        console.error("CREATE PROFILE ERROR:", err);
        res.status(500).json({ error: "serverError" });
    }
});

/* ========================= */
/* GET ALL (🌍 PUBLIC + LIMIT) */
/* ========================= */
router.get("/", async (req, res) => {
    try {
        const rows = await db.all(`
            SELECT id, name, description, keyword, city, score
            FROM business_profiles
            ORDER BY score DESC
        `);

        const isLimited = rows.length > 6;

        res.json({
            profiles: rows.slice(0, 6),
            isLimited
        });

    } catch (err) {
        console.error("GET PROFILES ERROR:", err);
        res.status(500).json({ error: "serverError" });
    }
});

/* ========================= */
/* 🌱 SEED DATA (DEV + ADMIN) */
/* ========================= */
router.post("/seed", authMiddleware, async (req, res) => {

    if (
        process.env.NODE_ENV !== "development" ||
        req.user?.role !== "ADMIN"
    ) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const existing = await db.all("SELECT id FROM business_profiles");

        if (existing.length > 0) {
            return res.json({ message: "Already seeded" });
        }

        const fakeData = [
            {
                name: "Agence SEO Paris",
                description: "Experts en référencement local",
                keyword: "SEO Paris",
                city: "Paris",
                score: 92
            },
            {
                name: "Coach Sport Lyon",
                description: "Coaching personnalisé à domicile",
                keyword: "coach sportif Lyon",
                city: "Lyon",
                score: 88
            },
            {
                name: "Plombier Marseille",
                description: "Intervention rapide 24h/24",
                keyword: "plombier Marseille",
                city: "Marseille",
                score: 85
            }
        ];

        for (const p of fakeData) {
            await db.run(`
                INSERT INTO business_profiles 
                (user_id, name, description, keyword, city, score)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                req.user.id,
                p.name,
                p.description,
                p.keyword,
                p.city,
                p.score
            ]);
        }

        res.json({ success: true });

    } catch (err) {
        console.error("SEED ERROR:", err);
        res.status(500).json({ error: "serverError" });
    }
});

/* ========================= */
/* 🔍 DEBUG VIEW (DEV ONLY) */
/* ========================= */
router.get("/debug", async (req, res) => {
    try {
        if (process.env.NODE_ENV !== "development") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const rows = await db.all("SELECT * FROM business_profiles");

        res.json(rows);

    } catch (err) {
        console.error("DEBUG ERROR:", err);
        res.status(500).json({ error: "serverError" });
    }
});

/* ========================= */
/* 🧨 RESET USER PROFILE (DEV) */
/* ========================= */
router.delete("/reset-me", authMiddleware, async (req, res) => {

    if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        await db.run(
            "DELETE FROM business_profiles WHERE user_id = ?",
            [req.user.id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "serverError" });
    }
});

/* ========================= */
/* 🧹 RESET ALL (DEV + ADMIN ONLY) */
/* ========================= */
router.delete("/reset", authMiddleware, async (req, res) => {
    try {

        /* 🔒 DOUBLE PROTECTION */
        if (
            process.env.NODE_ENV !== "development" ||
            req.user?.role !== "ADMIN"
        ) {
            return res.status(403).json({
                error: "Forbidden"
            });
        }

        await db.run("DELETE FROM business_profiles");

        res.json({
            success: true,
            message: "Database cleared"
        });

    } catch (err) {
        console.error("RESET ERROR:", err);
        res.status(500).json({ error: "serverError" });
    }
});

export default router;