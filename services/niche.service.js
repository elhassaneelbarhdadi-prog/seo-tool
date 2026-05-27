import OpenAI from "openai";

/* ========================= */
/* OPENAI */
/* ========================= */

const apiKey =
    process.env.OPENAI_API_KEY;

const openai =
    apiKey
        ? new OpenAI({ apiKey })
        : null;

/* ========================= */
/* FALLBACK */
/* ========================= */

const fallback = (keyword) => [

    {
        keyword: `${keyword} seo`,
        potentiel: "moyen",
        business: "blog"
    },

    {
        keyword: `${keyword} affiliation`,
        potentiel: "fort",
        business: "affiliate"
    },

    {
        keyword: `${keyword} automation`,
        potentiel: "fort",
        business: "saas"
    }

];

/* ========================= */
/* SAFE JSON */
/* ========================= */

const safeParse = (text = "") => {

    try {

        const cleaned =
            text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

        return JSON.parse(cleaned);

    }

    catch {

        return null;

    }

};

/* ========================= */
/* MAIN */
/* ========================= */

export const generateNichesAI =
    async (keyword = "") => {

        try {

            /* ========================= */
            /* NO OPENAI */
            /* ========================= */

            if (!openai) {

                console.warn(
                    "⚠️ OPENAI DISABLED"
                );

                return fallback(keyword);

            }

            const safeKeyword =
                String(keyword)
                    .trim()
                    .slice(0, 100);

            if (!safeKeyword) {
                return fallback("seo");
            }

            /* ========================= */
            /* PROMPT */
            /* ========================= */

            const prompt = `
Génère 5 niches business SEO rentables autour de "${safeKeyword}"

Réponds UNIQUEMENT en JSON.

Format STRICT :

[
  {
    "keyword": "...",
    "potentiel": "faible|moyen|fort",
    "business": "..."
  }
]
`;

            const response =
                await openai.chat.completions.create({

                    model: "gpt-4o-mini",

                    messages: [
                        {
                            role: "user",
                            content: prompt
                        }
                    ],

                    temperature: 0.7,

                    max_tokens: 400

                });

            const content =
                response?.choices?.[0]
                    ?.message?.content;

            if (!content) {

                console.warn(
                    "⚠️ EMPTY OPENAI RESPONSE"
                );

                return fallback(safeKeyword);

            }

            const parsed =
                safeParse(content);

            if (!Array.isArray(parsed)) {

                console.warn(
                    "⚠️ INVALID JSON"
                );

                return fallback(safeKeyword);

            }

            /* ========================= */
            /* CLEAN */
            /* ========================= */

            const cleaned =
                parsed

                    .filter(
                        item => item?.keyword
                    )

                    .map(item => ({

                        keyword:
                            String(
                                item.keyword
                            ).slice(0, 100),

                        potentiel:
                            item.potentiel || "moyen",

                        business:
                            item.business || "SEO"

                    }))

                    .slice(0, 5);

            return cleaned.length
                ? cleaned
                : fallback(safeKeyword);

        }

        catch (error) {

            console.error(
                "🔥 NICHES AI ERROR:",
                error
            );

            return fallback(keyword);

        }

    };