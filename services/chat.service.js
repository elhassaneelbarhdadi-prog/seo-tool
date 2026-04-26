import OpenAI from "openai";

/* ========================= */
/* GET OPENAI */
/* ========================= */
const getOpenAI = () => {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("⚠️ OpenAI désactivé (chat)");
        return null;
    }

    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
};

/* ========================= */
/* MAIN */
/* ========================= */
export const askSEOAI = async ({ question, keyword }) => {

    const openai = getOpenAI();

    if (!openai) {
        return "⚠️ IA désactivée";
    }

    const prompt = `
Tu es un expert SEO.

Mot-clé : ${keyword || "non défini"}

Question :
${question}

Réponse courte, claire, actionable.
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
    });

    return response.choices?.[0]?.message?.content || "Pas de réponse";
};