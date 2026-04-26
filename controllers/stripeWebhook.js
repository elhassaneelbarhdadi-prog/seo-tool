import Stripe from "stripe";
import db from "../config/database.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = async (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {

        console.log("🔔 EVENT:", event.type);

        /* ========================= */
        /* 💳 CHECKOUT SUCCESS */
        /* ========================= */
        if (event.type === "checkout.session.completed") {

            const session = event.data.object;

            const userId = session.metadata?.userId;

            if (!userId) {
                console.warn("⚠️ No userId in metadata");
                return res.json({ received: true });
            }

            if (!session.subscription) {
                console.warn("⚠️ No subscription ID");
                return res.json({ received: true });
            }

            const subscription = await stripe.subscriptions.retrieve(session.subscription);

            const priceId = subscription.items.data[0].price.id;

            let plan = "FREE";

            if (
                priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
                priceId === process.env.STRIPE_PRICE_PRO_YEARLY
            ) {
                plan = "PRO";
            }

            if (
                priceId === process.env.STRIPE_PRICE_BUSINESS_MONTHLY ||
                priceId === process.env.STRIPE_PRICE_BUSINESS_YEARLY
            ) {
                plan = "BUSINESS";
            }

            await db.run(
                `UPDATE users 
                 SET plan = ?, 
                     subscription_id = ?, 
                     subscription_status = 'active'
                 WHERE id = ?`,
                [plan, session.subscription, userId]
            );

            console.log("✅ PLAN ACTIVATED:", userId, plan);
        }

        /* ========================= */
        /* 🔁 RENEWAL PAYMENT */
        /* ========================= */
        if (event.type === "invoice.paid") {

            const invoice = event.data.object;

            const subscriptionId = invoice.subscription;

            const user = await db.get(
                "SELECT id FROM users WHERE subscription_id = ?",
                [subscriptionId]
            );

            if (user) {
                await db.run(
                    `UPDATE users 
                     SET subscription_status = 'active'
                     WHERE id = ?`,
                    [user.id]
                );

                console.log("💰 RENEWED:", user.id);
            }
        }

        /* ========================= */
        /* ❌ SUB CANCELLED */
        /* ========================= */
        if (event.type === "customer.subscription.deleted") {

            const subscription = event.data.object;

            const user = await db.get(
                "SELECT id FROM users WHERE subscription_id = ?",
                [subscription.id]
            );

            if (user) {
                await db.run(
                    `UPDATE users 
                     SET plan = 'FREE', 
                         subscription_status = 'cancelled'
                     WHERE id = ?`,
                    [user.id]
                );

                console.log("🔻 USER DOWNGRADED:", user.id);
            }
        }

        /* ========================= */
        /* ⚠️ SUB UPDATE */
        /* ========================= */
        if (event.type === "customer.subscription.updated") {

            const subscription = event.data.object;

            if (subscription.cancel_at_period_end) {
                console.log("⚠️ Will cancel:", subscription.id);
            }
        }

        res.json({ received: true });

    } catch (error) {

        console.error("🔥 WEBHOOK ERROR:", error);

        res.status(500).json({
            error: "Webhook processing failed"
        });
    }
};