export function generateLandingPage(keyword, difficulty, volume = 0, cpc = 0) {

    if (!keyword) return null;

    const niche = keyword.toLowerCase();

    /* ========================= */
    /* 🎯 ANGLE AUTO */
    /* ========================= */

    let angle = "default";

    if (/(argent|revenu|gagner|money)/.test(niche)) {
        angle = "money";
    } else if (/(trafic|seo|visiteurs)/.test(niche)) {
        angle = "traffic";
    } else if (/(business|dropshipping|ecommerce)/.test(niche)) {
        angle = "business";
    }

    /* ========================= */
    /* 🔥 HEADLINES */
    /* ========================= */

    let headline = "";
    let subheadline = "";

    switch (angle) {

        case "money":
            headline = `Générez des revenus avec ${niche} sans expérience`;
            subheadline = volume > 5000
                ? `Déjà adopté par des milliers d’utilisateurs`
                : `Une méthode simple pour monétiser rapidement`;
            break;

        case "traffic":
            headline = `Obtenez du trafic qualifié avec ${niche} sans publicité`;
            subheadline = `Une stratégie SEO durable et gratuite`;
            break;

        case "business":
            headline = `Lancez votre business en ${niche} dès aujourd’hui`;
            subheadline = `Un système clé en main pour démarrer rapidement`;
            break;

        default:
            if (difficulty > 70) {
                headline = `Dominez ${niche} malgré une forte concurrence`;
                subheadline = `Une approche avancée pour se différencier`;
            } else if (difficulty < 40) {
                headline = `Profitez de ${niche} avant tout le monde`;
                subheadline = `Une opportunité simple à exploiter maintenant`;
            } else {
                headline = `Obtenez des résultats avec ${niche} rapidement`;
                subheadline = `Une méthode claire pour passer à l’action`;
            }
    }

    /* ========================= */
    /* 💰 PRICING */
    /* ========================= */

    let price = 19;

    if (cpc > 1.5) price = 79;
    else if (cpc > 0.8) price = 49;
    else if (cpc > 0.3) price = 29;

    /* ========================= */
    /* 🎁 OFFRE */
    /* ========================= */

    const offer = [
        "Accès immédiat",
        "Stratégie complète",
        "Templates prêts à l'emploi",
        "Bonus exclusifs"
    ];

    /* ========================= */
    /* 🚀 CTA */
    /* ========================= */

    let cta = "Lancer maintenant";

    if (angle === "money") cta = "Générer mes revenus";
    if (angle === "traffic") cta = "Obtenir du trafic";
    if (angle === "business") cta = "Créer mon business";

    /* ========================= */
    /* 🧠 PROOF + URGENCY */
    /* ========================= */

    const proof =
        volume > 5000
            ? "🔥 Forte demande sur ce marché"
            : "📈 Opportunité encore peu exploitée";

    const urgency =
        difficulty > 70
            ? "Marché compétitif → agir rapidement"
            : "Profitez de cette opportunité avant saturation";

    return {
        headline,
        subheadline,
        offer,
        cta,
        price,
        proof,
        urgency,
        angle
    };
}