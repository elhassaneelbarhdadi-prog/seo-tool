import Stripe from "stripe";
import db from "../config/database.js";

/* ========================= */
/* STRIPE INIT */
/* ========================= */

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe key missing in ENV");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ========================= */
/* PLAN CONFIG (SAFE) */
/* ========================= */

const PRICE_MAP = {
    STARTER: "price_123456", // ⚠️ mets tes vrais price_id Stripe
    PRO: "price_789456"
};

/* ========================= */
/* CREATE CHECKOUT SESSION */
/* ========================= */

export const createCheckout = async (req, res) => {

    try {

        const userId = req.user.id;
        const { plan } = req.body;

        /* 🔒 VALIDATION PLAN */
        if (!PRICE_MAP[plan?.toUpperCase()]) {
            return res.status(400).json({ error: "Invalid plan" });
        }

        /* 🔍 GET USER */
        const user = await db.get(
            "SELECT email, stripe_customer_id FROM users WHERE id = ?",
            [userId]
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        let customerId = user.stripe_customer_id;

        /* 🔥 CREATE STRIPE CUSTOMER */
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

        /* 🚀 CREATE SESSION */
        const session = await stripe.checkout.sessions.create({

            customer: customerId,

            mode: "subscription",

            line_items: [
                {
                    price: PRICE_MAP[plan.toUpperCase()],
                    quantity: 1,
                },
            ],

            success_url: "http://localhost:5173/dashboard",
            cancel_url: "http://localhost:5173/pricing",

        });

        res.json({ url: session.url });

    } catch (error) {

        console.error("Stripe Checkout Error:", error);

        res.status(500).json({
            error: "Stripe checkout error",
        });
    }
};

/* ========================= */
/* BILLING PORTAL (REAL) */
/* ========================= */

export const billingPortal = async (req, res) => {

    try {

        const userId = req.user.id;

        const user = await db.get(
            "SELECT stripe_customer_id FROM users WHERE id = ?",
            [userId]
        );

        if (!user?.stripe_customer_id) {
            return res.status(400).json({
                error: "No subscription found"
            });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripe_customer_id,
            return_url: "http://localhost:5173/dashboard",
        });

        res.json({
            url: session.url,
        });

    } catch (error) {

        console.error("Portal Error:", error);

        res.status(500).json({
            error: "Billing portal error",
        });
    }
}; console.log("PRICE PRO MONTHLY 👉", process.env.STRIPE_PRICE_PRO_MONTHLY);