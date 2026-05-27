import { analyzeKeyword } from "../core/seoEngine.js";

export async function analyze(data, user) {

    /* ========================= */
    /* 🔒 INPUT VALIDATION */
    /* ========================= */
    const keyword =
        typeof data === "string"
            ? data
            : data?.keyword;

    if (!keyword || !keyword.trim()) {
        throw new Error("Keyword is required");
    }

    /* ========================= */
    /* 💰 USAGE CHECK */
    /* ========================= */
    if (user?.plan === "FREE") {

        const used = user?.usage?.used || 0;
        const limit = user?.usage?.limit || 5;

        if (used >= limit) {
            const err = new Error("Limit reached");
            err.status = 403;
            throw err;
        }
    }

    /* ========================= */
    /* 🧠 ENRICH DATA */
    /* ========================= */
    const enriched = {
        keyword: keyword.trim().toLowerCase(),
        userId: user?.id || null
    };

    /* ========================= */
    /* 🚀 CALL ENGINE */
    /* ========================= */
    const result = await analyzeKeyword(enriched);

    /* ========================= */
    /* 📊 USAGE INCREMENT */
    /* ========================= */
    if (user?.id && user?.plan === "FREE") {
        // 👉 à connecter à ta DB
        console.log("📈 Increment usage for user:", user.id);
    }

    return result;
}