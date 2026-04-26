import Stripe from "stripe";
import db from "../config/database.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ========================= */
/* 💳 CHECKOUT */
/* ========================= */
export const createCheckoutSession = async (req, res) => {
    try {

        const userId = req.user?.id;
        let { plan, isYearly } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!plan) {
            return res.status(400).json({ error: "Missing plan" });
        }

        plan = plan.toUpperCase(); // ✅ FIX

        /* ========================= */
        /* 🔍 USER */
        /* ========================= */
        const user = await db.get(
            "SELECT email, stripe_customer_id FROM users WHERE id = ?",
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        /* ========================= */
        /* 👤 CUSTOMER */
        /* ========================= */
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email
            });

            customerId = customer.id;

            await db.run(
                "UPDATE users SET stripe_customer_id = ? WHERE id = ?",
                [customerId, userId]
            );
        }

        /* ========================= */
        /* 💰 PRICE MAP */
        /* ========================= */
        const priceMap = {
            PRO: {
                monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
                yearly: process.env.STRIPE_PRICE_PRO_YEARLY
            },
            BUSINESS: {
                monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
                yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY
            }
        };

        const selectedPlan = priceMap[plan];

        if (!selectedPlan) {
            return res.status(400).json({ error: "Invalid plan" });
        }

        const priceId = isYearly
            ? selectedPlan.yearly
            : selectedPlan.monthly;

        if (!priceId) {
            return res.status(400).json({ error: "Missing priceId" });
        }

        /* ========================= */
        /* 🌍 URL */
        /* ========================= */
        const baseUrl = process.env.FRONT_URL || "http://localhost:5173";

        /* ========================= */
        /* 💳 SESSION */
        /* ========================= */
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            success_url: `${baseUrl}/success`,
            cancel_url: `${baseUrl}/pricing`,
            metadata: {
                userId,
                plan
            }
        });

        res.json({ url: session.url });

    } catch (error) {

        console.error("🔥 CHECKOUT ERROR:", error);

        res.status(500).json({
            error: "Stripe checkout failed"
        });
    }
};