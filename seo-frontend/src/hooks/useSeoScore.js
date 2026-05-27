import { useCallback } from "react";

export function useSeoScore() {

    /* ========================= */
    /* 🎯 GET SCORE */
    /* ========================= */
    const getScore = useCallback((data = {}) => {
        return Number(data?.scoreFinal ?? data?.score) || 0;
    }, []);

    /* ========================= */
    /* 🎨 META */
    /* ========================= */
    const getScoreMeta = useCallback((score = 0) => {

        if (score >= 75) {
            return {
                label: "🚀 Forte opportunité",
                color: "text-green-600",
                bg: "bg-green-100",
                badge: "GO"
            };
        }

        if (score >= 50) {
            return {
                label: "⚡ Opportunité moyenne",
                color: "text-yellow-600",
                bg: "bg-yellow-100",
                badge: "WAIT"
            };
        }

        if (score >= 30) {
            return {
                label: "⚠️ Difficile",
                color: "text-orange-500",
                bg: "bg-orange-100",
                badge: "HARD"
            };
        }

        return {
            label: "❌ Très difficile",
            color: "text-red-600",
            bg: "bg-red-100",
            badge: "NO_GO"
        };
    }, []);

    /* ========================= */
    /* 🎯 FULL OBJECT */
    /* ========================= */
    const getSeoData = useCallback((data = {}) => {
        const score = getScore(data);
        const meta = getScoreMeta(score);

        return {
            score,
            ...meta
        };
    }, [getScore, getScoreMeta]);

    return {
        getScore,
        getScoreMeta,
        getSeoData // 🔥 super utile pour UI
    };
}