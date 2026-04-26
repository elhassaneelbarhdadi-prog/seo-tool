export function generateFullFunnel(keyword, difficulty) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 POSITIONNEMENT */
    /* ========================= */

    const hook = `Comment profiter de ${niche} sans perdre de temps`;

    const headline = `Le meilleur ${niche} pour obtenir des résultats rapidement`;

    const subheadline = `Une méthode simple et efficace utilisée par des centaines d’utilisateurs`;

    /* ========================= */
    /* 💰 OFFRE */
    /* ========================= */

    const price = difficulty > 70 ? 49 : difficulty > 50 ? 29 : 19;

    const offer = `Accès immédiat + stratégie complète + bonus exclusifs`;

    /* ========================= */
    /* 📈 TRAFIC */
    /* ========================= */

    let traffic = "SEO + contenu long tail";

    if (difficulty > 70) {
        traffic = "TikTok Ads + SEO + influenceurs";
    } else if (difficulty > 50) {
        traffic = "SEO + Pinterest + Ads";
    }

    /* ========================= */
    /* 📦 UPSELL */
    /* ========================= */

    const upsell = `Pack premium ${niche} (+ coaching + templates)`;

    return {
        hook,
        headline,
        subheadline,
        offer,
        price,
        traffic,
        upsell
    };
}