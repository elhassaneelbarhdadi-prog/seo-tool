export const generateFakeSEOData = (keyword = "") => {

    /* ========================= */
    /* 🔢 SEED STABLE */
    /* ========================= */
    const hash = (str) =>
        str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const seed = hash(keyword || "default");

    const rand = (min, max) =>
        Math.floor((seed % (max - min)) + min);

    /* ========================= */
    /* 📊 VOLUME */
    /* ========================= */
    const volume = rand(1000, 50000);

    /* ========================= */
    /* ⚔️ DIFFICULTY (corrélé volume) */
    /* ========================= */
    const difficulty = Math.min(
        100,
        Math.round((volume / 50000) * 100 + rand(-10, 10))
    );

    /* ========================= */
    /* 💰 CPC (corrélé difficulté) */
    /* ========================= */
    const cpc = (
        (difficulty / 100) * 2 + (rand(0, 50) / 100)
    ).toFixed(2);

    /* ========================= */
    /* 🧠 COMPETITION (aligné difficulté) */
    /* ========================= */
    const competition = (difficulty / 100).toFixed(2);

    /* ========================= */
    /* 💡 SUGGESTIONS */
    /* ========================= */
    const suggestions = [
        `${keyword} femme`,
        `${keyword} homme`,
        `${keyword} pas cher`,
        `meilleur ${keyword}`,
        `${keyword} avis`,
        `${keyword} 2026`,
        `${keyword} comparatif`,
        `${keyword} prix`
    ];

    return {
        keyword,
        volume,
        difficulty,
        cpc: Number(cpc),
        competition: Number(competition),
        suggestions
    };
};