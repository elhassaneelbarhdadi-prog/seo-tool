/* ========================= */
/* 🧠 CLEAN (UPGRADED) */
/* ========================= */
const cleanKeyword = (keyword = "") => {
    return keyword
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’]/g, " ")
        .replace(/[^a-z0-9\s-]/g, " ")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

/* ========================= */
/* 🧠 MAIN WORD (SMART) */
/* ========================= */
const getMainWord = (keyword) => {

    const stopWords = [
        "de", "a", "le", "la", "les", "du", "des",
        "un", "une", "pour", "avec", "sur"
    ];

    const weakWords = ["meilleur", "top", "guide", "comparatif"];

    const words = keyword.split(" ");

    return words.find(
        w => !stopWords.includes(w) && !weakWords.includes(w)
    ) || words[0];
};

/* ========================= */
/* 🧠 PLURAL (SAFE) */
/* ========================= */
const pluralize = (word = "") => {

    if (!word) return word;

    const irregular = {
        cheval: "chevaux",
        travail: "travaux"
    };

    if (irregular[word]) return irregular[word];

    if (word.endsWith("al")) return word.replace(/al$/, "aux");
    if (word.endsWith("eau")) return word + "x";
    if (word.endsWith("s")) return word;

    return word + "s";
};

/* ========================= */
/* 🧠 TYPE (UPGRADED) */
/* ========================= */
export const detectKeywordType = (keyword = "") => {

    const k = keyword.toLowerCase();

    const serviceKeywords = [
        "plombier", "coach", "avocat", "agence",
        "consultant", "freelance", "expert",
        "reparation", "depannage", "installation"
    ];

    if (serviceKeywords.some(w => k.includes(w))) {
        return "service";
    }

    return "product";
};

/* ========================= */
/* 🧠 BUSINESS */
/* ========================= */
const getBusinessLabel = (keyword) => {

    const type = detectKeywordType(keyword);
    const main = getMainWord(keyword);
    const pluralMain = pluralize(main);

    if (type === "service") {
        return pluralMain;
    }

    return `vendeurs de ${pluralMain}`;
};

/* ========================= */
/* 🔀 VARIATIONS */
/* ========================= */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ========================= */
/* 🧠 DESCRIPTION (BOOSTED) */
/* ========================= */
const generateDescription = (keyword, business) => {

    const intros = [
        `Trouvez facilement des ${business} adaptés à vos besoins.`,
        `Découvrez les meilleurs ${business} pour "${keyword}".`,
        `Comparez les offres de ${business} disponibles.`
    ];

    const middles = [
        `Analysez les prix, les avis clients et les prestations pour "${keyword}".`,
        `Choisissez la solution la plus rentable selon votre besoin.`,
        `Plusieurs options existent selon votre budget et vos objectifs.`
    ];

    const endings = [
        `Notre plateforme vous aide à faire le bon choix rapidement.`,
        `Gagnez du temps en accédant directement aux meilleures solutions.`,
        `Identifiez facilement les opportunités les plus intéressantes.`
    ];

    return `${pick(intros)} ${pick(middles)} ${pick(endings)}`;
};

/* ========================= */
/* 🧠 FAQ (BOOSTED) */
/* ========================= */
const generateFAQ = (keyword) => {

    return [
        {
            q: `Quel est le prix de ${keyword} ?`,
            a: `Le prix dépend de plusieurs facteurs comme la qualité, la localisation et le niveau de service.`
        },
        {
            q: `Comment choisir ${keyword} ?`,
            a: `Comparez les avis, les tarifs et les prestations pour faire le meilleur choix.`
        },
        {
            q: `${capitalize(keyword)} est-il rentable ?`,
            a: `Oui, surtout si la demande est forte et la concurrence modérée.`
        }
    ];
};

/* ========================= */
/* 🚀 LANDING */
/* ========================= */
export const generateLandingContent = (rawKeyword) => {

    const keyword = cleanKeyword(rawKeyword);

    if (!keyword) return null;

    const business = getBusinessLabel(keyword);

    return {
        title: `${capitalize(keyword)} : analyse SEO et opportunité`,
        description: generateDescription(keyword, business),
        business,
        faq: generateFAQ(keyword)
    };
};

/* ========================= */
/* 🚀 CTA */
/* ========================= */
export const generateCTA = (keyword, business) => {

    const clean = cleanKeyword(keyword);

    const titles = [
        `${capitalize(clean)} ?`,
        `Besoin de ${clean} ?`,
        `Envie de clients en ${clean} ?`
    ];

    return {
        title: pick(titles),
        subtitle: `Attirez des clients en tant que ${business}`,
        bullets: [
            "Visibilité sur Google",
            "Clients qualifiés",
            "Trafic SEO gratuit"
        ],
        button: "🚀 S’inscrire gratuitement"
    };
};

/* ========================= */
/* ✨ UTILS */
/* ========================= */
const capitalize = (str = "") =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";