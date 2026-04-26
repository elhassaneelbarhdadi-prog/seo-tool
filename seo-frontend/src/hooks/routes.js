export const routes = {
    login: (lang) => `/${lang}/login`,
    register: (lang) => `/${lang}/register`,

    dashboard: (lang) => `/${lang}/dashboard`,
    keywords: (lang) => `/${lang}/dashboard/keywords`,
    pricing: (lang) => `/${lang}/dashboard/pricing`,
    niches: (lang) => `/${lang}/dashboard/niches`,
    annuaire: (lang) => `/${lang}/dashboard/annuaire`,
    business: (lang) => `/${lang}/dashboard/business-profile`,

    seo: (lang, keyword) => `/${lang}/seo/${keyword}`,
};