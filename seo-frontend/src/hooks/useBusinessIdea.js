export function generateBusinessIdea(keyword, difficulty) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 POSITIONNEMENT */
    /* ========================= */

    let angle = "Produit simple avec différenciation";

    if (difficulty > 70) {
        angle = "Niche ultra spécifique + branding fort";
    } else if (difficulty > 50) {
        angle = "Produit + contenu SEO + preuve sociale";
    }

    /* ========================= */
    /* 💰 PRIX */
    /* ========================= */

    const price = difficulty > 70 ? 49 : difficulty > 50 ? 29 : 19;

    /* ========================= */
    /* 🚀 TRAFIC */
    /* ========================= */

    let traffic = "SEO + contenu long tail";

    if (difficulty > 70) {
        traffic = "SEO + TikTok Ads + influence";
    } else if (difficulty > 50) {
        traffic = "SEO + Pinterest + Ads légères";
    }

    return {
        product: `Boutique spécialisée ${niche}`,
        angle,
        price,
        traffic,
        hook: `Découvrez le meilleur ${niche} sans perdre de temps`,
    };
}