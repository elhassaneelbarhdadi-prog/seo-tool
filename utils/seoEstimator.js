export const estimateSEO = (keyword = "") => {

    const clean = keyword.toLowerCase().trim();

    const words = clean.split(/\s+/).filter(Boolean).length;

    /* ========================= */
    /* 📊 VOLUME */
    /* ========================= */
    const volume = Math.round(800 + clean.length * 70);

    /* ========================= */
    /* 💰 CPC */
    /* ========================= */
    const cpc = 0.3 + words * 0.2;

    /* ========================= */
    /* 💵 REVENUE */
    /* ========================= */
    const revenue = Math.round(volume * cpc * 0.25);

    /* ========================= */
    /* ⚔️ DIFFICULTÉ */
    /* ========================= */
    const difficulty = Math.min(100, 40 + words * 15);

    const competition =
        difficulty > 70 ? "élevée" :
            difficulty > 40 ? "modérée" :
                "faible";

    /* ========================= */
    /* 🎯 SCORE GLOBAL */
    /* ========================= */
    const score = Math.min(
        100,
        Math.round((volume / 100) + (cpc * 30))
    );

    return {
        volume,
        cpc,
        revenue,
        competition,
        difficulty,
        score
    };
};