export function generateFullFunnel(keyword, difficulty, volume = 0, cpc = 0) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 POSITIONNEMENT */
    /* ========================= */

    const hook = `Comment réussir avec ${niche} sans perdre de temps ni d'argent`;

    const headline = `Le système complet pour maîtriser ${niche} rapidement`;

    const subheadline = volume > 5000
        ? `Déjà adopté par des milliers d’utilisateurs`
        : `Une méthode simple et efficace, testée et approuvée`;

    /* ========================= */
    /* 🎯 AVATAR (important SaaS) */
    /* ========================= */

    const target =
        difficulty > 70
            ? "Professionnels / experts"
            : difficulty > 40
                ? "Intermédiaires"
                : "Débutants";

    /* ========================= */
    /* 💰 PRICING (basé CPC) */
    /* ========================= */

    let price = 19;

    if (cpc > 1.5) price = 79;
    else if (cpc > 0.8) price = 49;
    else if (cpc > 0.3) price = 29;

    /* ========================= */
    /* 📈 TRAFIC */
    /* ========================= */

    let traffic = "SEO long tail + contenu";

    if (difficulty > 70) {
        traffic = "SEO + Ads + influenceurs + branding";
    } else if (difficulty > 50) {
        traffic = "SEO + Pinterest + contenu blog";
    }

    /* ========================= */
    /* 📦 OFFRE */
    /* ========================= */

    const offer = `
✔ Accès immédiat à la stratégie ${niche}
✔ Méthode étape par étape
✔ Templates prêts à l'emploi
✔ Bonus exclusifs
`;

    /* ========================= */
    /* 🚀 UPSELL */
    /* ========================= */

    const upsell = `Coaching avancé + optimisation complète ${niche}`;

    /* ========================= */
    /* 🧠 PROOF (conversion clé) */
    /* ========================= */

    const proof =
        volume > 5000
            ? "🔥 Forte demande sur ce marché"
            : "📈 Opportunité encore peu exploitée";

    /* ========================= */
    /* ⚡ URGENCE */
    /* ========================= */

    const urgency =
        difficulty > 70
            ? "Marché compétitif → agir rapidement"
            : "Profitez de cette opportunité avant saturation";

    return {
        hook,
        headline,
        subheadline,

        target,
        offer,
        price,

        traffic,
        upsell,

        proof,
        urgency
    };
}