import express from "express";
import OpenAI from "openai";

const router = express.Router();

/* ========================= */
/* 🔥 INIT OPENAI */
/* ========================= */

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY manquant");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/* ========================= */
/* 🤖 SEO CHAT */
/* ========================= */

router.post("/seo", async (req, res) => {
    try {
        const { prompt, keyword, serp, products } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt manquant" });
        }

        console.log("👉 PROMPT:", prompt);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `
Tu es un expert SEO senior.

Ta mission :
- proposer des niches SEO rentables
- analyser le potentiel business
- détecter la concurrence
- donner des idées actionnables

Réponds en français.

Format OBLIGATOIRE pour chaque idée :

1. Nom de la niche
2. Pourquoi c'est rentable
3. Niveau de concurrence (faible / moyen / élevé)
4. Idée de monétisation
`
                },
                {
                    role: "user",
                    content: `
Contexte SEO :

Keyword: ${keyword || "N/A"}
SERP: ${serp ? JSON.stringify(serp) : "N/A"}
Produits: ${products ? JSON.stringify(products) : "N/A"}

Question :
${prompt}
`
                }
            ],
            temperature: 0.7
        });

        const result = response.choices?.[0]?.message?.content || "";

        res.json({ result });

    } catch (error) {
        console.error("🔥 AI ERROR:", error);

        res.status(500).json({
            error: "Erreur OpenAI",
            details: error.message
        });
    }
});

export default router;