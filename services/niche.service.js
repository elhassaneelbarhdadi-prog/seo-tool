import OpenAI from "openai";

/* ========================= */
/* GET OPENAI */
/* ========================= */
const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️ OpenAI désactivé (niches)");
        return null;
    }

    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
};

/* ========================= */
/* SAFE PARSE */
/* ========================= */
const safeParse = (content) => {
    try {
        const cleaned = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

/* ========================= */
/* MAIN */
/* ========================= */
export const generateNichesAI = async (keyword) => {

    const openai = getOpenAI();

    if (!openai) {
        return [
            {
                keyword: `${keyword} idée`,
                potentiel: "moyen",
                business: "fallback"
            }
        ];
    }

    const prompt = `
Donne-moi 5 niches SEO pour "${keyword}"

Format JSON STRICT :
[
 { "keyword": "...", "potentiel": "fort", "business": "..." }
]
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
    });

    const content = response.choices[0].message.content;

    const parsed = safeParse(content);

    return Array.isArray(parsed) ? parsed : [];
};