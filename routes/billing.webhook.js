import express from "express";
import Stripe from "stripe";
import sqlite3 from "sqlite3";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const db = new sqlite3.Database("./database.sqlite");

/* ========================= */
/* 🔔 STRIPE WEBHOOK */
/* ========================= */
router.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log("❌ Webhook error:", err.message);
        return res.sendStatus(400);
    }

    const data = event.data.object;

    /* ========================= */
    /* 💰 CHECKOUT SUCCESS */
    /* ========================= */
    if (event.type === "checkout.session.completed") {

        const customerId = data.customer;

        db.run(
            "UPDATE users SET plan = 'PRO', stripe_customer_id = ? WHERE stripe_customer_id = ?",
            [customerId, customerId],
            (err) => {
                if (err) console.log(err.message);
                else console.log("✅ User upgraded via checkout:", customerId);
            }
        );
    }

    /* ========================= */
    /* 🔄 SUBSCRIPTION ACTIVE */
    /* ========================= */
    if (event.type === "invoice.paid") {

        const customerId = data.customer;

        db.run(
            "UPDATE users SET plan = 'PRO' WHERE stripe_customer_id = ?",
            [customerId]
        );

        console.log("💰 Subscription renewed:", customerId);
    }

    /* ========================= */
    /* ❌ SUBSCRIPTION CANCELLED */
    /* ========================= */
    if (event.type === "customer.subscription.deleted") {

        const customerId = data.customer;

        db.run(
            "UPDATE users SET plan = 'FREE' WHERE stripe_customer_id = ?",
            [customerId]
        );

        console.log("❌ Subscription cancelled:", customerId);
    }

    res.json({ received: true });
});

export default router;