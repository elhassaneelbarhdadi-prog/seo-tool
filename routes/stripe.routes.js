import express from "express";
import Stripe from "stripe";
import { authMiddleware } from "../middleware/auth.middleware.js";
import db from "../config/database.js";
import { PLANS } from "../config/plans.js";
import "../config/env.js"; // 🔥 PREMIER IMPORT
const router = express.Router();

/* ========================= */
/* 🔥 STRIPE INIT */
/* ========================= */

if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ STRIPE_SECRET_KEY manquant");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

/* ========================= */
/* 💳 CHECKOUT */
/* ========================= */

router.post("/checkout", authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        let { plan, isYearly } = req.body;

        console.log("👉 BODY:", req.body);
        console.log("👉 USER:", req.user);

        /* ========================= */
        /* 🔒 VALIDATION */
        /* ========================= */

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!plan) {
            return res.status(400).json({ error: "Plan manquant" });
        }

        plan = plan.toUpperCase();

        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(400).json({ error: "Plan invalide" });
        }

        const priceId = isYearly
            ? selectedPlan.yearlyPriceId
            : selectedPlan.monthlyPriceId;

        if (!priceId) {
            return res.status(400).json({ error: "price_id manquant" });
        }

        console.log("👉 PLAN:", plan);
        console.log("👉 PRICE ID:", priceId);

        /* ========================= */
        /* 👤 USER */
        /* ========================= */

        const user = await db.get(
            "SELECT email, stripe_customer_id FROM users WHERE id = ?",
            [userId]
        );

        if (!user?.email) {
            return res.status(400).json({ error: "User email manquant" });
        }

        let customerId = user.stripe_customer_id;

        /* ========================= */
        /* 🆕 CREATE CUSTOMER */
        /* ========================= */

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email
            });

            customerId = customer.id;

            await db.run(
                "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
                [customerId, userId]
            );

            console.log("🆕 CUSTOMER CREATED:", customerId);
        }

        /* ========================= */
        /* 🔍 CHECK SUB */
        /* ========================= */

        const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1
        });

        /* ========================= */
        /* 🔁 UPGRADE / DOWNGRADE */
        /* ========================= */

        if (subs.data.length > 0) {

            const subscription = subs.data[0];
            const itemId = subscription.items.data[0].id;

            await stripe.subscriptions.update(subscription.id, {
                items: [{
                    id: itemId,
                    price: priceId
                }],
                proration_behavior: "create_prorations"
            });

            await db.run(
                "UPDATE users SET plan = ? WHERE id = ?",
                [plan, userId]
            );

            console.log("🔁 PLAN UPDATED:", userId, plan);

            return res.json({
                upgraded: true
            });
        }

        /* ========================= */
        /* 🚀 NEW CHECKOUT */
        /* ========================= */

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            success_url: `${CLIENT_URL}/fr/dashboard`,
            cancel_url: `${CLIENT_URL}/fr/dashboard/pricing`,
            metadata: {
                userId: String(userId),
                plan: String(plan)
            }
        });

        console.log("✅ NEW CHECKOUT:", session.id);

        res.json({ url: session.url });

    } catch (error) {
        console.error("🔥 STRIPE ERROR:", error);

        res.status(500).json({
            error: "Erreur Stripe",
            details: error.message
        });
    }
});

/* ========================= */
/* 💳 CUSTOMER PORTAL */
/* ========================= */

router.post("/portal", authMiddleware, async (req, res) => {
    try {

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await db.get(
            "SELECT stripe_customer_id FROM users WHERE id = ?",
            [userId]
        );

        if (!user?.stripe_customer_id) {
            return res.status(400).json({
                error: "Aucun customer Stripe"
            });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: `${CLIENT_URL}/fr/dashboard`
        });

        res.json({ url: session.url });

    } catch (error) {

        console.error("❌ PORTAL ERROR:", error);

        res.status(500).json({
            error: "Erreur portail Stripe",
            details: error.message
        });
    }
});

export default router;