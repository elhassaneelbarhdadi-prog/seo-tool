export function analyzeProductSEO({ title = "", description = "", keyword = "" }) {

    let score = 0;
    let improvements = [];

    const safeTitle = title.toLowerCase();
    const safeDescription = description.toLowerCase();
    const safeKeyword = keyword.toLowerCase();

    /* ========================= */
    /* 🧠 SCORE TITRE (35 pts) */
    /* ========================= */

    let titleScore = 0;

    if (title.length >= 30 && title.length <= 60) {
        titleScore += 20;
    } else {
        improvements.push("Le titre doit contenir entre 30 et 60 caractères");
    }

    if (safeTitle.includes(safeKeyword)) {
        titleScore += 15;
    } else {
        improvements.push("Ajoute le mot-clé principal dans le titre");
    }

    score += titleScore;

    /* ========================= */
    /* 📝 DESCRIPTION (35 pts) */
    /* ========================= */

    let descScore = 0;

    if (description.length >= 120) {
        descScore += 15;
    } else {
        improvements.push("Ajoute une description plus détaillée (min 120 caractères)");
    }

    if (safeDescription.includes(safeKeyword)) {
        descScore += 10;
    } else {
        improvements.push("Ajoute le mot-clé dans la description");
    }

    // BONUS lisibilité
    if (description.split(" ").length >= 20) {
        descScore += 10;
    } else {
        improvements.push("Ajoute plus de contenu pour améliorer le SEO");
    }

    score += descScore;

    /* ========================= */
    /* 🔍 DENSITÉ MOT-CLÉ (15 pts) */
    /* ========================= */

    let keywordCount = (safeDescription.match(new RegExp(safeKeyword, "g")) || []).length;

    if (keywordCount >= 2 && keywordCount <= 5) {
        score += 15;
    } else if (keywordCount === 0) {
        improvements.push("Le mot-clé n'apparaît pas dans la description");
    } else {
        improvements.push("Optimise la densité du mot-clé (2 à 5 fois recommandé)");
    }

    /* ========================= */
    /* 🚀 BONUS SEO (15 pts) */
    /* ========================= */

    if (title.includes("|") || title.includes("-")) {
        score += 5;
    } else {
        improvements.push("Ajoute un séparateur SEO dans le titre (| ou -)");
    }

    if (description.includes("!") || description.includes("?")) {
        score += 5;
    }

    if (safeDescription.includes("meilleur") || safeDescription.includes("top")) {
        score += 5;
    }

    /* ========================= */
    /* 🔒 NORMALISATION */
    /* ========================= */

    if (score > 100) score = 100;

    return {
        score,
        titleScore,
        improvements
    };
}


/* SCORE DESCRIPTION */
let descriptionScore = 0;

if (description.length >= 120) {

    descriptionScore += 20;

} else {

    improvements.push("La description est trop courte");

}

if (description.toLowerCase().includes(keyword.toLowerCase())) {

    descriptionScore += 15;

} else {

    improvements.push("Ajoute le mot-clé dans la description");

}


/* SCORE MOT CLE */
let keywordScore = 0;

if (keyword.length >= 3) {

    keywordScore += 15;

} else {

    improvements.push("Mot-clé trop court");

}


score = titleScore + descriptionScore + keywordScore;

let level = "Faible";

if (score >= 70) level = "Fort";
else if (score >= 40) level = "Moyen";


return {

    score,
    level,

    breakdown: {

        titleScore,
        descriptionScore,
        keywordScore

    },

    improvements

};

