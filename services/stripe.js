import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";

/* ========================= */
/* 🔐 CHECK ENV */
/* ========================= */
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("❌ STRIPE_SECRET_KEY is missing in .env");
}

/* ========================= */
/* 🚀 INIT STRIPE */
/* ========================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20", // ✅ toujours fixer version
});

/* ========================= */
/* 🧪 DEBUG SAFE */
/* ========================= */
if (process.env.NODE_ENV !== "production") {
    console.log("✅ Stripe initialized");
}

export default stripe;