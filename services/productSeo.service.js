export function analyzeProductSEO({ title = "", description = "", keyword = "" }) {

    let score = 0;
    let improvements = [];

    const safeTitle = title.toLowerCase();
    const safeDescription = description.toLowerCase();
    const safeKeyword = keyword.toLowerCase();

    /* ========================= */
    /* 🧠 TITLE (30 pts) */
    /* ========================= */
    let titleScore = 0;

    if (title.length >= 30 && title.length <= 60) {
        titleScore += 15;
    } else {
        improvements.push("Le titre doit contenir entre 30 et 60 caractères");
    }

    if (safeTitle.includes(safeKeyword)) {
        titleScore += 15;
    } else {
        improvements.push("Ajoute le mot-clé principal dans le titre");
    }

    /* ========================= */
    /* 📝 DESCRIPTION (40 pts) */
    /* ========================= */
    let descriptionScore = 0;

    if (description.length >= 120) {
        descriptionScore += 20;
    } else {
        improvements.push("Description trop courte (min 120 caractères)");
    }

    if (safeDescription.includes(safeKeyword)) {
        descriptionScore += 10;
    } else {
        improvements.push("Ajoute le mot-clé dans la description");
    }

    if (description.split(" ").length >= 20) {
        descriptionScore += 10;
    } else {
        improvements.push("Ajoute plus de contenu pour le SEO");
    }

    /* ========================= */
    /* 🔍 KEYWORD (15 pts) */
    /* ========================= */
    let keywordScore = 0;

    const keywordCount =
        (safeDescription.match(new RegExp(safeKeyword, "g")) || []).length;

    if (keywordCount >= 2 && keywordCount <= 5) {
        keywordScore += 15;
    } else if (keywordCount === 0) {
        improvements.push("Le mot-clé n'apparaît pas");
    } else {
        improvements.push("Densité mot-clé à optimiser (2-5 recommandé)");
    }

    /* ========================= */
    /* 🚀 BONUS (15 pts) */
    /* ========================= */
    let bonusScore = 0;

    if (title.includes("|") || title.includes("-")) {
        bonusScore += 5;
    }

    if (description.includes("!") || description.includes("?")) {
        bonusScore += 5;
    }

    if (safeDescription.includes("meilleur") || safeDescription.includes("top")) {
        bonusScore += 5;
    }

    /* ========================= */
    /* 📊 TOTAL */
    /* ========================= */
    score = titleScore + descriptionScore + keywordScore + bonusScore;

    if (score > 100) score = 100;

    let level = "Faible";
    if (score >= 70) level = "Fort";
    else if (score >= 40) level = "Moyen";

    return {
        score,
        level,
        breakdown: {
            titleScore,
            descriptionScore,
            keywordScore,
            bonusScore
        },
        improvements
    };
}