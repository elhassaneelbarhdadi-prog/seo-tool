
const API_BASE = "http://localhost:3001/api";

/* ========================= */
/* 🌐 ROUTES */
/* ========================= */

export const API = {
    seoAnalyze: "/seo/analyze",
    nicheGenerate: "/niche/generate",
    chatSEO: "/chat/seo",

    keywordHistory: "/keyword/history",
    keywordUsage: "/keyword/usage",

    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",

    plans: "/plans",
    checkout: "/stripe/checkout",

    resetUsage: "/dev/reset-usage"
};

/* ========================= */
/* 🧠 CORE REQUEST */
/* ========================= */

const request = async (url, options = {}) => {

    const token = localStorage.getItem("token");

    const res = await fetch(API_BASE + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...options.headers
        }
    });

    const text = await res.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Invalid JSON response");
    }

    if (!res.ok) {

        const error = new Error(data?.error || "API error");

        error.status = res.status;
        error.code = data?.error;

        throw error;
    }

    return data;
};

/* ========================= */
/* 🚀 SEO */
/* ========================= */

export const analyzeKeyword = (keyword) =>
    request(API.seoAnalyze, {
        method: "POST",
        body: JSON.stringify({ keyword })
    });

/* ========================= */
/* 🧠 NICHES */
/* ========================= */

export const getNichesAI = (keyword) =>
    request(API.nicheGenerate, {
        method: "POST",
        body: JSON.stringify({ keyword })
    });

/* ========================= */
/* 🤖 CHAT */
/* ========================= */

export const askSEO = (payload) =>
    request(API.chatSEO, {
        method: "POST",
        body: JSON.stringify(payload)
    });

/* ========================= */
/* 📊 HISTORY */
/* ========================= */

export const getKeywordHistory = () =>
    request(API.keywordHistory);

/* ========================= */
/* 📈 USAGE */
/* ========================= */

export const getKeywordUsage = () =>
    request(API.keywordUsage);

/* ========================= */
/* 🔐 AUTH */
/* ========================= */

export const login = (body) =>
    request(API.login, {
        method: "POST",
        body: JSON.stringify(body)
    });

export const register = (body) =>
    request(API.register, {
        method: "POST",
        body: JSON.stringify(body)
    });

export const getMe = () =>
    request(API.me);

/* ========================= */
/* 💰 STRIPE */
/* ========================= */

export const checkout = () =>
    request(API.checkout, {
        method: "POST"
    });

/* ========================= */
/* 🧪 DEV */
/* ========================= */

export const resetUsage = () =>
    request(API.resetUsage, {
        method: "POST"
    });
export { request };