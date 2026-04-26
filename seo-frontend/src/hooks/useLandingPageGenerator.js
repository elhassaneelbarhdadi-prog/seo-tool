export function generateLandingPage(keyword, difficulty) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 ANGLE AUTO */
    /* ========================= */

    let angle = "default";

    if (
        niche.includes("argent") ||
        niche.includes("gagner") ||
        niche.includes("revenu")
    ) {
        angle = "money";
    } else if (
        niche.includes("trafic") ||
        niche.includes("seo") ||
        niche.includes("visiteurs")
    ) {
        angle = "traffic";
    } else if (
        niche.includes("business") ||
        niche.includes("dropshipping") ||
        niche.includes("ecommerce")
    ) {
        angle = "business";
    }

    /* ========================= */
    /* 🔥 HEADLINES */
    /* ========================= */

    let headline = "";
    let subheadline = "";

    switch (angle) {

        case "money":
            headline = `Générez vos premiers revenus avec ${niche} en moins de 30 jours`;
            subheadline = `Une méthode simple pour transformer ${niche} en source de revenus`;
            break;

        case "traffic":
            headline = `Attirez du trafic qualifié avec ${niche} sans dépendre des pubs`;
            subheadline = `Une stratégie simple pour générer du trafic gratuitement`;
            break;

        case "business":
            headline = `Lancez un business rentable en ${niche} même en partant de zéro`;
            subheadline = `Un système clé en main pour créer votre projet rapidement`;
            break;

        default:
            if (difficulty > 70) {
                headline = `Prenez une longueur d’avance sur ${niche} malgré la concurrence`;
                subheadline = `Une méthode optimisée pour se démarquer rapidement`;
            } else if (difficulty < 40) {
                headline = `Profitez de ${niche} avant vos concurrents`;
                subheadline = `Une opportunité simple à exploiter dès aujourd’hui`;
            } else {
                headline = `Obtenez vos premiers résultats avec ${niche} en moins de 7 jours`;
                subheadline = `Une méthode simple pour passer à l’action rapidement`;
            }
    }

    /* ========================= */
    /* 🎁 OFFRE */
    /* ========================= */

    const offer = "Accès immédiat + stratégie complète + templates + bonus exclusifs";

    /* ========================= */
    /* 🚀 CTA */
    /* ========================= */

    let cta = `Lancer mon projet`;

    if (angle === "money") {
        cta = "Générer mes premiers revenus";
    } else if (angle === "traffic") {
        cta = "Attirer du trafic maintenant";
    } else if (angle === "business") {
        cta = "Créer mon business";
    }

    return {
        headline,
        subheadline,
        offer,
        cta
    };
}