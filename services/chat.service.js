import OpenAI from "openai";

/* ========================= */
/* 🔐 GET OPENAI SAFE */
/* ========================= */
const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.warn("⚠️ OpenAI désactivé (chat)");
        return null;
    }

    return new OpenAI({ apiKey });
};

/* ========================= */
/* 🧠 MAIN */
/* ========================= */
export const askSEOAI = async ({ question, keyword }) => {

    try {

        /* ========================= */
        /* 🔒 INPUT VALIDATION */
        /* ========================= */
        if (!question || typeof question !== "string") {
            return "❌ Question invalide";
        }

        const openai = getOpenAI();

        if (!openai) {
            return "⚠️ IA désactivée";
        }

        /* ========================= */
        /* ✂️ LIMIT INPUT (anti abuse) */
        /* ========================= */
        const safeQuestion = question.slice(0, 500);
        const safeKeyword = (keyword || "").slice(0, 100);

        /* ========================= */
        /* 🧠 PROMPT */
        /* ========================= */
        const prompt = `
Tu es un expert SEO.

Mot-clé : ${safeKeyword || "non défini"}

Question :
${safeQuestion}

Réponse courte, claire, actionable (max 5 lignes).
`;

        /* ========================= */
        /* 🤖 CALL */
        /* ========================= */
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.6,
            max_tokens: 300
        });

        const content = response.choices?.[0]?.message?.content;

        if (!content) {
            return "⚠️ Pas de réponse IA";
        }

        return content.trim();

    } catch (error) {

        console.error("🔥 AI ERROR:", error.message);

        /* ========================= */
        /* 💸 COST SAFETY */
        /* ========================= */
        if (error?.status === 429) {
            return "⚠️ Trop de requêtes, réessaie plus tard";
        }

        return "❌ Erreur IA";
    }
};