/* ========================= */
/* 🧠 CLEAN */
/* ========================= */
const cleanKeyword = (keyword) => {
    if (!keyword) return "";

    return keyword
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};

/* ========================= */
/* 🧠 EXTRACT MAIN WORD */
/* ========================= */
const getMainWord = (keyword) => {
    return keyword.split(" ")[0];
};

/* ========================= */
/* 🧠 PLURAL SAFE */
/* ========================= */
const pluralize = (word) => {
    if (!word) return word;

    if (word.endsWith("s")) return word;
    if (word.endsWith("al")) return word.replace("al", "aux");

    return word + "s";
};

/* ========================= */
/* 🧠 TYPE */
/* ========================= */
export const detectKeywordType = (keyword) => {
    const k = keyword.toLowerCase();

    const service = ["plombier", "coach", "avocat", "répar", "agence"];

    if (service.some(w => k.includes(w))) return "service";

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
/* 🧠 DYNAMIC DESCRIPTION */
/* ========================= */
const generateDescription = (keyword, city, business) => {

    const intros = [
        `Trouvez facilement des ${business} à ${city}.`,
        `Découvrez les meilleurs ${business} disponibles à ${city}.`,
        `À ${city}, comparez les ${business} pour ${keyword}.`
    ];

    const middles = [
        `Comparez les prix, les avis clients et les prestations pour "${keyword}".`,
        `Analysez les offres disponibles et choisissez la meilleure solution pour "${keyword}".`,
        `Les professionnels de ${city} proposent différentes options adaptées à "${keyword}".`
    ];

    const endings = [
        `Notre plateforme vous permet de gagner du temps et de trouver rapidement le bon ${business}.`,
        `Gagnez en visibilité et trouvez les meilleurs services en quelques clics.`,
        `Identifiez rapidement des professionnels fiables à ${city}.`
    ];

    return `
${pick(intros)}

${pick(middles)}

${pick(endings)}
    `;
};

/* ========================= */
/* 🧠 FAQ DYNAMIQUE */
/* ========================= */
const generateFAQ = (keyword, city) => {

    const priceTemplates = [
        `Les prix pour ${keyword} à ${city} varient selon la qualité et les prestations.`,
        `À ${city}, le coût de ${keyword} dépend du niveau de service proposé.`,
    ];

    const choiceTemplates = [
        `Pour choisir ${keyword}, il est important de comparer les avis et les prix.`,
        `Un bon ${keyword} doit être fiable, bien noté et disponible rapidement.`,
    ];

    return [
        {
            q: `Quel est le prix de ${keyword} à ${city} ?`,
            a: pick(priceTemplates)
        },
        {
            q: `Comment choisir ${keyword} ?`,
            a: pick(choiceTemplates)
        }
    ];
};

/* ========================= */
/* 🚀 LANDING */
/* ========================= */
export const generateLandingContent = (rawKeyword, city) => {

    const keyword = cleanKeyword(rawKeyword);
    const business = getBusinessLabel(keyword);

    return {
        title: `${capitalize(keyword)} à ${city}`,
        description: generateDescription(keyword, city, business),
        business,
        faq: generateFAQ(keyword, city)
    };
};

/* ========================= */
/* 🚀 CTA */
/* ========================= */
export const generateCTA = (keyword, city, business) => {

    const clean = cleanKeyword(keyword);

    const titles = [
        `${capitalize(clean)} à ${city} ?`,
        `Besoin de ${clean} à ${city} ?`,
    ];

    return {
        title: pick(titles),
        subtitle: `Recevez des clients en tant que ${business} à ${city}`,
        bullets: [
            "Visibilité sur Google",
            "Clients qualifiés",
            "Sans engagement"
        ],
        button: "🚀 S’inscrire gratuitement"
    };
};

/* ========================= */
/* ✨ UTILS */
/* ========================= */
const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);