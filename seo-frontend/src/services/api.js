import { API_BASE } from "../config";

/* ========================= */
/* 🌐 ROUTES */
/* ========================= */

export const API = {
    seoAnalyze: "/seo/analyze",
    seoFreeAnalyze: "/seo/free-analyze",

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
/* 🧠 CORE REQUEST (SAFE) */
/* ========================= */

const request = async (
    url,
    options = {},
    {
        isPublic = false,
        timeout = 10000,
        redirectOn401 = true,
        redirectOn403 = true
    } = {}
) => {
    console.log("👉 API CALL:", API_BASE + url);

    const token = localStorage.getItem("token");
    const controller = new AbortController();

    const signal = options.signal || controller.signal;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(API_BASE + url, {
            ...options,
            signal,
            headers: {
                "Content-Type": "application/json",
                ...(token && !isPublic && {
                    Authorization: "Bearer " + token
                }),
                ...(options.headers || {})
            }
        });

        clearTimeout(timer);

        let data = null;

        try {
            data = await res.json();
        } catch {
            throw new Error("Invalid JSON response");
        }

        /* ========================= */
        /* AUTH HANDLING */
        /* ========================= */

        if (!isPublic && res.status === 401) {
            if (redirectOn401) {
                localStorage.removeItem("token");
                window.location.href = "/fr/login";
                return;
            }

            const error = new Error(data?.error || "Unauthorized");
            error.status = 401;
            error.data = data;
            throw error;
        }

        if (!isPublic && res.status === 403) {
            if (redirectOn403) {
                window.location.href = "/fr/dashboard/pricing";
                return;
            }

            const error = new Error(data?.error || "Forbidden");
            error.status = 403;
            error.data = data;
            throw error;
        }

        if (!res.ok) {
            const error = new Error(
                data?.error || `HTTP ${res.status}`
            );

            error.status = res.status;
            error.data = data;
            throw error;
        }

        return data;

    } catch (err) {
        clearTimeout(timer);

        if (err.name === "AbortError") {
            throw new Error("Request timeout");
        }

        console.error("❌ REQUEST ERROR:", err);
        throw err;
    }
};

/* ========================= */
/* 🚀 SEO */
/* ========================= */

export const analyzeKeywordFree = (keyword, guestId) =>
    request(
        API.seoFreeAnalyze,
        {
            method: "POST",
            headers: {
                "x-guest-id": guestId
            },
            body: JSON.stringify({ keyword })
        },
        {
            isPublic: true
        }
    );
export const analyzeKeyword = (keyword) =>
    request(
        API.seoAnalyze,
        {
            method: "POST",
            body: JSON.stringify({ keyword })
        },
        {
            redirectOn401: false,
            redirectOn403: false
        }
    );

export const deleteKeyword = async (id) => {
    return request(`/keyword/${id}`, {
        method: "DELETE"
    });
};

/* ========================= */
/* 🧠 NICHES */
/* ========================= */

export const getNichesAI = (
    keyword,
    options = {}
) =>
    request(
        API.nicheGenerate,
        {
            method: "POST",
            body: JSON.stringify({ keyword }),
            signal: options.signal
        },
        {
            timeout: 30000
        }
    );

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
    request(
        API.login,
        {
            method: "POST",
            body: JSON.stringify(body)
        },
        { isPublic: true }
    );

export const register = (body) =>
    request(
        API.register,
        {
            method: "POST",
            body: JSON.stringify(body)
        },
        { isPublic: true }
    );

export const getMe = () =>
    request(API.me);

/* ========================= */
/* 💰 STRIPE */
/* ========================= */

export const checkout = (plan, isYearly = false) =>
    request(API.checkout, {
        method: "POST",
        body: JSON.stringify({ plan, isYearly })
    });

export const deleteAllKeywords = async () => {
    return request("/keyword/all", {
        method: "DELETE"
    });
};

/* ========================= */
/* 🧪 DEV */
/* ========================= */

export const resetUsage = () =>
    request(API.resetUsage, {
        method: "POST"
    });

/* ========================= */
/* EXPORT */
/* ========================= */

export { request };