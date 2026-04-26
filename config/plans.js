/* ========================= */
/* 📦 PLANS CONFIG */
/* ========================= */

export const PLANS = {

    FREE: {
        key: "FREE",
        limit: 5,
        price: 0,
        features: [
            "Analyse SEO limitée",
            "Historique basique",
            "Accès lecture annuaire"
        ]
    },

    PRO: {
        key: "PRO",
        limit: 120,
        price: 19,
        monthlyPriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
        yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY,
        features: [
            "Analyses SEO avancées",
            "Suggestions de niches",
            "Export CSV",
            "Accès annuaire"
        ]
    },

    BUSINESS: {
        key: "BUSINESS",
        limit: Infinity, // ✅ plus safe que null
        price: 39,
        monthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
        yearlyPriceId: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
        features: [
            "Analyses illimitées",
            "Automatisation SEO",
            "Accès annuaire complet",
            "Fonctionnalités avancées",
            "Support prioritaire"
        ]
    }
};


/* ========================= */
/* 🔒 VALID PLANS */
/* ========================= */

export const VALID_PLANS = Object.keys(PLANS);


/* ========================= */
/* 🧠 HELPERS */
/* ========================= */

/* 🔍 Get plan (safe fallback) */
export const getPlan = (key) => {
    if (!key) return PLANS.FREE;
    return PLANS[key.toUpperCase()] || PLANS.FREE;
};

/* 💰 Paid plan check */
export const isPaidPlan = (key) => {
    return ["PRO", "BUSINESS"].includes(key);
};

/* 💳 Stripe price ID */
export const getPriceId = (plan, isYearly = false) => {

    const p = getPlan(plan);

    if (!isPaidPlan(p.key)) return null;

    const priceId = isYearly
        ? p.yearlyPriceId
        : p.monthlyPriceId;

    if (!priceId) {
        throw new Error(`Missing Stripe price ID for plan ${p.key}`);
    }

    return priceId;
};

/* 📊 Limit check */
export const getLimit = (plan) => {
    const p = getPlan(plan);
    return p.limit;
};

/* 🚫 Usage guard */
export const hasReachedLimit = (usage, plan) => {

    const limit = getLimit(plan);

    if (limit === Infinity) return false;

    return usage >= limit;
};