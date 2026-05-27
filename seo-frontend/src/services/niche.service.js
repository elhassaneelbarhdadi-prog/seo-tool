import { API, request } from "./api";

export const getNichesAI = async (keyword) => {

    const cleanKeyword = keyword?.trim();

    if (!cleanKeyword) {
        throw new Error("Keyword required");
    }

    const data = await request(API.nicheGenerate, {
        method: "POST",
        body: JSON.stringify({ keyword: cleanKeyword })
    });

    /* ========================= */
    /* 🔄 NORMALISATION */
    /* ========================= */
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.niches)) return data.niches;
    if (Array.isArray(data?.data)) return data.data;

    console.warn("⚠️ Format niches inconnu:", data);

    return [];
};