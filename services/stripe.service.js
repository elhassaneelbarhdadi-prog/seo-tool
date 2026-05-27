import Stripe from "stripe";

/* ========================= */
/* 🔐 INIT */
/* ========================= */
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

/* ========================= */
/* 💰 PRICES (ID STRIPE) */
/* ========================= */
// 👉 CRÉE CES PRIX DANS STRIPE (IMPORTANT)
const PRICE_IDS = {
    PRO: process.env.STRIPE_PRICE_PRO,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
};

/* ========================= */
/* 🚀 CHECKOUT */
/* ========================= */
export const createCheckoutSession = async ({
    email,
    userId,
    plan = "PRO"
}) => {

    if (!email) {
        throw new Error("Email required");
    }

    const priceId = PRICE_IDS[plan];

    if (!priceId) {
        throw new Error("Invalid plan");
    }

    const session = await stripe.checkout.sessions.create({

        mode: "subscription",

        customer_email: email,

        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],

        /* ========================= */
        /* 🔥 CRUCIAL POUR WEBHOOK */
        /* ========================= */
        metadata: {
            userId,
            plan
        },

        success_url: `${process.env.FRONT_URL}/fr/dashboard?success=1`,
        cancel_url: `${process.env.FRONT_URL}/fr/dashboard/pricing?cancel=1`,

    });

    return session.url;
};