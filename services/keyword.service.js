export const generateFakeSEOData = (keyword) => {
    const suggestions = [
        `${keyword} femme`,
        `${keyword} homme`,
        `${keyword} pas cher`,
        `meilleur ${keyword}`,
        `${keyword} avis`,
        `${keyword} 2026`,
        `${keyword} nike`,
        `${keyword} adidas`
    ];

    return {
        keyword: keyword,
        volume: Math.floor(Math.random() * 50000) + 1000,
        difficulty: Math.floor(Math.random() * 100),
        cpc: (Math.random() * 2).toFixed(2),
        competition: Math.random().toFixed(2),
        suggestions: suggestions
    };
};