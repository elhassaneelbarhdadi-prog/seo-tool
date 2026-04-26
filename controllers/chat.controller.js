import db from "../config/database.js";
import OpenAI from "openai";
import { PLANS } from "../config/plans.js";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const askSEO = async (req, res) => {

    try {

        const { question, keyword, serp = [], products = [] } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!question?.trim()) {
            return res.status(400).json({ error: "Question required" });
        }

        /* ========================= */
        /* 🔥 PLAN + LIMIT */
        /* ========================= */

        const user = await db.get(
            "SELECT plan FROM users WHERE id = ?",
            [userId]
        );

        const plan = user?.plan || "FREE";
        const planData = PLANS[plan] || PLANS.FREE;
        const limit = planData.limit;

        const usage = await db.get(`
            SELECT COUNT(*) as total
            FROM ai_usage
            WHERE user_id = ?
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `, [userId]);

        if (limit !== Infinity && usage.total >= limit) {
            return res.status(403).json({
                error: "LIMIT_REACHED"
            });
        }

        /* ========================= */
        /* 🧠 CONTEXT */
        /* ========================= */

        const topSerp = serp.slice(0, 3)
            .map(s => `- ${s.title}`)
            .join("\n");

        const topProducts = products.slice(0, 3)
            .map(p => `- ${p.title} (${p.price})`)
            .join("\n");

        /* ========================= */
        /* 🤖 PROMPT */
        /* ========================= */

        const prompt = `
Tu es un expert SEO + business.

Mot-clé : ${keyword || "N/A"}

Concurrents :
${topSerp || "aucun"}

Produits :
${topProducts || "aucun"}

Question : ${question}

Réponds avec :
- analyse SEO
- opportunité
- idée business
- revenu estimé
- action immédiate
`;

        /* ========================= */
        /* 🤖 OPENAI */
        /* ========================= */

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        });

        const answer = response.choices?.[0]?.message?.content || "Pas de réponse";

        /* ========================= */
        /* 💾 TRACK */
        /* ========================= */

        await db.run(`
            INSERT INTO ai_usage (user_id, message)
            VALUES (?, ?)
        `, [userId, question]);

        res.json({ answer });

    } catch (error) {

        console.error("CHAT ERROR:", error);

        res.status(500).json({
            error: "Chat error"
        });
    }
};