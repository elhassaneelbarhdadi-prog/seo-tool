

export function useSeoScore() {

    /* ========================= */
    /* 🔤 LABEL */
    /* ========================= */
    const getScoreLabel = (score = 0) => {

        if (score > 85) return "🔴 Très difficile";
        if (score > 65) return "🟠 Concurrentiel";
        if (score > 40) return "🟡 Opportunité moyenne";
        return "🟢 Facile à rank";

    };

    /* ========================= */
    /* 📊 UTILISE LE SCORE EXISTANT */
    /* ========================= */
    const getScore = (data = {}) => {
        return data.score ?? 50;
    };

    return {
        getScoreLabel,
        getScore
    };
}