import db from "../config/database.js";
import { generateKeywordIdeas } from "../services/ai.service.js";
import { PLANS } from "../config/plans.js";

/* ========================= */
/* 🔥 HELPER USAGE */
/* ========================= */
const incrementUsage = async (userId, keyword = "ai") => {
    if (!userId) return;

    console.log("✅ INCREMENT USAGE:", userId, keyword);

    await db.run(`
        INSERT INTO ai_usage (user_id, message, created_at)
        VALUES (?, ?, datetime('now'))
    `, [userId, keyword]);
};

/* ========================= */
/* 📊 USAGE */
/* ========================= */
export const getUsage = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.get(`
            SELECT COUNT(*) as total
            FROM ai_usage
            WHERE user_id = ?
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `, [userId]);

        const user = await db.get(
            "SELECT plan FROM users WHERE id = ?",
            [userId]
        );

        const plan = user?.plan || "FREE";
        const planData = PLANS[plan] || PLANS.FREE;

        const limit =
            planData.limit === null || planData.limit === undefined
                ? Infinity
                : planData.limit;

        res.json({
            used: result?.total || 0,
            limit,
            plan
        });

    } catch (error) {
        console.error("USAGE ERROR:", error);
        res.status(500).json({ error: "Usage error" });
    }
};

/* ========================= */
/* 📜 HISTORY */
/* ========================= */
export const getKeywordHistory = async (req, res) => {
    try {
        const userId = req.user?.id;

        const rows = await db.all(`
            SELECT *
            FROM keywords
            WHERE user_id = ?
            AND deleted = 0
            ORDER BY id DESC
        `, [userId]);

        res.json(rows);

    } catch (error) {
        console.error("HISTORY ERROR:", error);
        res.status(500).json({ error: "History error" });
    }
};

/* ========================= */
/* 🤖 AI KEYWORDS */
/* ========================= */
export const generateAIKeywords = async (req, res) => {
    try {
        const { keyword } = req.body;
        const userId = req.user?.id;

        if (!keyword?.trim()) {
            return res.status(400).json({ error: "Keyword required" });
        }

        const ideas = await generateKeywordIdeas(keyword);

        await incrementUsage(userId, keyword);

        res.json({ keyword, ideas });

    } catch (error) {
        console.error("AI ERROR:", error);
        res.status(500).json({ error: "AI keyword generation error" });
    }
};

/* ========================= */
/* 🔍 ANALYZE */
/* ========================= */
export const analyzeKeyword = async (req, res) => {
    try {

        const { keyword } = req.body;
        const userId = req.user?.id;

        if (!keyword?.trim()) {
            return res.status(400).json({ error: "Keyword required" });
        }

        const user = await db.get(
            "SELECT plan FROM users WHERE id = ?",
            [userId]
        );

        const plan = user?.plan || "FREE";
        const planData = PLANS[plan] || PLANS.FREE;

        const limit =
            planData.limit === null ? Infinity : planData.limit;

        const usage = await db.get(`
            SELECT COUNT(*) as total
            FROM ai_usage
            WHERE user_id = ?
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `, [userId]);

        if (limit !== Infinity && usage.total >= limit) {
            return res.status(403).json({
                error: "Limit reached"
            });
        }

        /* FAKE DATA */
        const volume = Math.floor(Math.random() * 50000) + 1000;
        const difficulty = Math.floor(Math.random() * 100);
        const cpc = Number((Math.random() * 5).toFixed(2));

        const score = 100 - difficulty;
        const revenue = Math.round(volume * 0.02 * cpc);

        const trend = Array.from({ length: 12 }, (_, i) =>
            Math.round(1000 + Math.sin(i) * 300 + Math.random() * 200)
        );

        const products = [
            {
                title: `${keyword} premium`,
                price: Math.round(cpc * 20),
                link: "#",
                thumbnail: "https://via.placeholder.com/150"
            }
        ];

        const serp = Array.from({ length: 5 }, (_, i) => ({
            title: `${keyword} résultat ${i + 1}`,
            link: `https://site${i + 1}.com/${keyword.replace(/\s/g, "-")}`,
            snippet: "Description SEO simulée"
        }));

        await db.run(`
            INSERT INTO keywords
            (keyword, volume, difficulty, cpc, intent, score, revenue, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
            keyword,
            volume,
            difficulty,
            cpc,
            "commercial",
            score,
            revenue,
            userId
        ]);

        await incrementUsage(userId, keyword);

        res.json({
            keyword,
            volume,
            difficulty,
            cpc,
            score,
            revenue,
            trend,
            products,
            serp
        });

    } catch (error) {
        console.error("ANALYZE ERROR:", error);
        res.status(500).json({ error: "Keyword analyze error" });
    }
};

/* ========================= */
/* 🗑 DELETE */
/* ========================= */
export const deleteKeyword = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        await db.run(`
            UPDATE keywords
            SET deleted = 1
            WHERE id = ? AND user_id = ?
        `, [id, userId]);

        res.json({ success: true });

    } catch (error) {
        console.error("DELETE ERROR:", error);
        res.status(500).json({ error: "Delete error" });
    }
}; export const getKeywordSuggestions = async (req, res) => {
    try {
        const { keyword, lang = "fr" } = req.body;

        if (!keyword?.trim()) {
            return res.status(400).json({ error: "Keyword required" });
        }

        const suffixes = {
            fr: ["pas cher", "avis", "comparatif", "meilleur", "prix"],
            en: ["cheap", "review", "comparison", "best", "price"]
        };

        const selected = suffixes[lang] || suffixes.fr;

        const suggestions = selected.map(s => `${keyword} ${s}`);

        res.json({ keyword, suggestions });

    } catch (error) {
        console.error("SUGGEST ERROR:", error);
        res.status(500).json({ error: "Suggestion error" });
    }
};