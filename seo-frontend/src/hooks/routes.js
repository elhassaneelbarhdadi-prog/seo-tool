const DEFAULT_LANG = "fr";

const safeLang = (lang) => lang || DEFAULT_LANG;

const safeKeyword = (keyword) =>
    encodeURIComponent(keyword || "");

export const routes = {
    login: (lang) => `/${safeLang(lang)}/login`,
    register: (lang) => `/${safeLang(lang)}/register`,

    dashboard: (lang) => `/${safeLang(lang)}/dashboard`,
    keywords: (lang) => `/${safeLang(lang)}/dashboard/keywords`,
    pricing: (lang) => `/${safeLang(lang)}/dashboard/pricing`,
    niches: (lang) => `/${safeLang(lang)}/dashboard/niches`,
    annuaire: (lang) => `/${safeLang(lang)}/dashboard/annuaire`,
    business: (lang) => `/${safeLang(lang)}/dashboard/business-profile`,

    seo: (lang, keyword) =>
        `/${safeLang(lang)}/seo/${safeKeyword(keyword)}`
};