export function generateBusinessIdea(keyword, difficulty, volume = 0, cpc = 0) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 POSITIONNEMENT */
    /* ========================= */

    let angle = "Offre simple avec différenciation claire";

    if (difficulty > 70) {
        angle = "Hyper niche + branding + offre premium";
    } else if (difficulty > 50) {
        angle = "Produit + contenu SEO + preuve sociale";
    } else {
        angle = "Offre simple + rapide à lancer";
    }

    /* ========================= */
    /* 💰 PRIX (basé sur CPC) */
    /* ========================= */

    let price = 19;

    if (cpc > 1.5) price = 59;
    else if (cpc > 0.8) price = 39;
    else if (cpc > 0.3) price = 29;

    /* ========================= */
    /* 🚀 TRAFIC (basé sur difficulté) */
    /* ========================= */

    let traffic = "SEO long tail + contenu simple";

    if (difficulty > 70) {
        traffic = "SEO + Ads + influenceurs + branding";
    } else if (difficulty > 50) {
        traffic = "SEO + Pinterest + contenu blog";
    }

    /* ========================= */
    /* 🧠 TYPE DE BUSINESS */
    /* ========================= */

    let type = "boutique";

    if (cpc > 1) type = "service premium";
    else if (volume > 5000) type = "media + affiliation";
    else if (difficulty < 40) type = "micro-niche e-commerce";

    /* ========================= */
    /* 🎣 HOOK */
    /* ========================= */

    const hook = `Le meilleur ${niche} pour gagner du temps et éviter les erreurs`;

    /* ========================= */
    /* 💡 IDÉE FINALE */
    /* ========================= */

    return {
        type,
        product: `${type} spécialisée ${niche}`,
        angle,
        price,
        traffic,
        hook,

        // 🔥 BONUS utile
        potential:
            volume > 5000
                ? "fort"
                : volume > 1000
                    ? "moyen"
                    : "faible"
    };
}