import OpenAI from "openai";

/* ========================= */
/* 🔐 GET OPENAI SAFE */
/* ========================= */
const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️ OpenAI désactivé");
        return null;
    }

    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
};

/* ========================= */
/* 🛡 SAFE JSON PARSER */
/* ========================= */
const safeParse = (content) => {
    try {
        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleaned);
    } catch (e) {
        console.error("PARSE ERROR:", content);
        return null;
    }
};

/* ========================= */
/* 🔥 KEYWORDS */
/* ========================= */
export const generateKeywordIdeas = async (keyword) => {

    const openai = getOpenAI();

    if (!openai) {
        return [
            `${keyword} comparatif`,
            `${keyword} avis`,
            `${keyword} meilleur`
        ];
    }

    const prompt = `
Donne-moi 10 mots-clés SEO pour "${keyword}"

Format JSON STRICT :
["mot clé 1", "mot clé 2"]
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const parsed = safeParse(response.choices[0].message.content);

    return Array.isArray(parsed) ? parsed : [];
};

/* ========================= */
/* 🔥 COMPETITORS */
/* ========================= */
export const generateSEOCompetitors = async (keyword) => {

    const openai = getOpenAI();

    if (!openai) return [];

    const prompt = `
Donne 4 concurrents SEO pour "${keyword}"

Format JSON STRICT :
[{ "site": "exemple.com", "authority": 80 }]
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const parsed = safeParse(response.choices[0].message.content);

    return Array.isArray(parsed) ? parsed : [];
};

/* ========================= */
/* 🚀 NICHES */
/* ========================= */
export const generateNichesAI = async (keyword) => {

    const openai = getOpenAI();

    if (!openai) {
        return [
            {
                keyword: `${keyword} comparatif`,
                potentiel: "moyen",
                business: "Site SEO"
            }
        ];
    }

    const prompt = `
Génère 5 niches SEO pour "${keyword}"

Format JSON STRICT :
[
 { "keyword": "...", "potentiel": "fort", "business": "..." }
]
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;

    console.log("AI RAW 👉", content);

    const parsed = safeParse(content);

    return Array.isArray(parsed) ? parsed : [];
};