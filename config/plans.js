/* ========================= */
/* PLANS */
/* ========================= */

export const PLANS = {

    FREE: {

        key: "FREE",

        name: "Gratuit",

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

        name: "PRO",

        limit: 120,

        price: 19,

        monthlyPriceId:
            process.env
                .STRIPE_PRICE_PRO_MONTHLY,

        yearlyPriceId:
            process.env
                .STRIPE_PRICE_PRO_YEARLY,

        features: [

            "Analyses SEO avancées",

            "Suggestions SEO avancées",

            "Export CSV",

            "Accès lecture annuaire"

        ]

    },

    BUSINESS: {

        key: "BUSINESS",

        name: "BUSINESS",

        limit: null,

        price: 39,

        monthlyPriceId:
            process.env
                .STRIPE_PRICE_BUSINESS_MONTHLY,

        yearlyPriceId:
            process.env
                .STRIPE_PRICE_BUSINESS_YEARLY,

        features: [

            "Analyses illimitées",

            "Historique complet",

            "Suggestions SEO avancées",

            "Accès annuaire complet",

            "Référencement SEO avec annuaire",

            "Support prioritaire"

        ]

    }

};

/* ========================= */
/* VALIDATION */
/* ========================= */

export const VALID_PLANS =
    Object.freeze(
        Object.keys(PLANS)
    );

/* ========================= */
/* GET PLAN */
/* ========================= */

export const getPlan = (
    key = "FREE"
) => {

    const upper =
        String(key)
            .trim()
            .toUpperCase();

    if (
        !VALID_PLANS.includes(
            upper
        )
    ) {

        if (
            process.env.NODE_ENV
            === "development"
        ) {

            console.warn(
                "⚠️ Invalid plan:",
                key
            );

        }

        return PLANS.FREE;
    }

    return PLANS[upper];

};

/* ========================= */
/* PAID */
/* ========================= */

export const isPaidPlan = (
    key
) => {

    if (!key) {

        return false;

    }

    return [

        "PRO",

        "BUSINESS"

    ].includes(

        String(key)
            .toUpperCase()

    );

};

/* ========================= */
/* STRIPE PRICE */
/* ========================= */

export const getPriceId = (
    plan,
    isYearly = false
) => {

    const p =
        getPlan(plan);

    if (
        !isPaidPlan(
            p.key
        )
    ) {

        return null;

    }

    const priceId =
        isYearly
            ? p.yearlyPriceId
            : p.monthlyPriceId;

    if (!priceId) {

        console.error(

            `❌ Missing Stripe Price ID for ${p.key}`

        );

        return null;

    }

    return priceId;

};

/* ========================= */
/* LIMIT */
/* ========================= */

export const getLimit =
    (plan) => {

        return getPlan(
            plan
        ).limit;

    };

/* ========================= */
/* LIMIT CHECK */
/* ========================= */

export const hasReachedLimit = (
    usage = 0,
    plan
) => {

    const limit =
        getLimit(plan);

    if (
        limit === null
    ) {

        return false;

    }

    return Number(
        usage
    ) >= Number(
        limit
    );

};

/* ========================= */
/* SAFE SERIALIZER */
/* IMPORTANT FOR FRONTEND */
/* ========================= */

export const serializePlans = () => {

    return Object.fromEntries(

        Object.entries(PLANS).map(

            ([key, plan]) => [

                key,

                {

                    key:
                        plan.key,

                    name:
                        plan.name,

                    limit:
                        plan.limit,

                    price:
                        plan.price,

                    features:
                        plan.features

                }

            ]

        )

    );

};

/* ========================= */
/* DEV CHECK */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    for (
        const plan
        of Object.values(
            PLANS
        )
    ) {

        if (

            plan.price > 0 &&

            (

                !plan.monthlyPriceId ||

                !plan.yearlyPriceId

            )

        ) {

            console.warn(

                `⚠️ Missing Stripe IDs for ${plan.key}`

            );

        }

    }

}