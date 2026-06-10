import express from "express";
import Stripe from "stripe";

import { authMiddleware }
    from "../middleware/auth.middleware.js";

import db
    from "../config/database.js";

import { PLANS }
    from "../config/plans.js";

import "../config/env.js";

const router =
    express.Router();

/* ========================= */
/* STRIPE */
/* ========================= */

if (
    !process.env.STRIPE_SECRET_KEY
) {

    throw new Error(
        "STRIPE_SECRET_KEY missing"
    );

}

const stripe =
    new Stripe(
        process.env.STRIPE_SECRET_KEY
    );

const FRONT_URL = process.env.FRONT_URL;

if (!FRONT_URL) {
    throw new Error("FRONT_URL missing");
}
/* ========================= */
/* CHECKOUT */
/* ========================= */

router.post(
    "/checkout",
    authMiddleware,
    async (req, res) => {

        console.log("================================");
        console.log("🚀 CHECKOUT ROUTE CALLED");
        console.log("🚀 METHOD:", req.method);
        console.log("🚀 URL:", req.originalUrl);
        console.log("🚀 CONTENT-TYPE:", req.headers["content-type"]);
        console.log("🚀 HEADERS:", req.headers);
        console.log("🚀 BODY:", req.body);
        console.log("================================");

        try {

            const userId = req.user?.id;

            console.log("🚀 USER ID:", userId);
            console.log("🚀 USER:", req.user);

            if (!userId) {

                return res.status(401).json({
                    success: false,
                    error: "Unauthorized"
                });

            }

            if (!req.body) {

                return res.status(400).json({
                    success: false,
                    error: "Body missing",
                    contentType: req.headers["content-type"]
                });

            }

            let {
                plan,
                isYearly = false
            } = req.body;

            console.log("🚀 PLAN RAW:", plan);
            console.log("🚀 YEARLY RAW:", isYearly);

            if (!plan) {

                return res.status(400).json({
                    success: false,
                    error: "Missing plan",
                    body: req.body
                });

            }

            if (typeof isYearly === "string") {

                isYearly =
                    isYearly === "true";

            }

            plan =
                String(plan)
                    .toUpperCase();

            console.log("🚀 PLAN NORMALIZED:", plan);
            console.log("🚀 YEARLY NORMALIZED:", isYearly);

            const selectedPlan =
                PLANS[plan];

            console.log(
                "🚀 SELECTED PLAN:",
                selectedPlan
            );

            if (!selectedPlan) {

                return res.status(400).json({
                    success: false,
                    error: "Invalid plan",
                    availablePlans: Object.keys(PLANS)
                });

            }

            const priceId =
                isYearly
                    ? selectedPlan.yearlyPriceId
                    : selectedPlan.monthlyPriceId;

            console.log("🚀 PRICE ID:", priceId);

            if (!priceId) {

                return res.status(400).json({
                    success: false,
                    error: "Missing Stripe price"
                });

            }

            const user =
                await db.get(
                    `
                    SELECT
                        email,
                        stripe_customer_id,
                        subscription_status
                    FROM users
                    WHERE id=?
                    LIMIT 1
                    `,
                    [userId]
                );

            console.log("🚀 DB USER:", user);

            if (!user) {

                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });

            }

            if (
                user.subscription_status === "active"
            ) {

                return res.status(400).json({
                    success: false,
                    error: "Already subscribed"
                });

            }

            let customerId = null;

            try {

                if (user.stripe_customer_id) {

                    const existingCustomer =
                        await stripe.customers.retrieve(
                            user.stripe_customer_id
                        );

                    if (
                        existingCustomer &&
                        !existingCustomer.deleted
                    ) {

                        customerId =
                            existingCustomer.id;

                        console.log(
                            "✅ Existing Stripe customer:",
                            customerId
                        );

                    }

                }

            } catch (error) {

                console.log(
                    "⚠️ Invalid Stripe customer detected"
                );

                console.log(error);

                await db.run(
                    `
                    UPDATE users
                    SET stripe_customer_id = NULL
                    WHERE id = ?
                    `,
                    [userId]
                );

            }

            if (!customerId) {

                console.log(
                    "🆕 Creating Stripe customer"
                );

                const customer =
                    await stripe.customers.create({
                        email: user.email
                    });

                customerId =
                    customer.id;

                console.log(
                    "✅ New customer:",
                    customerId
                );

                await db.run(
                    `
                    UPDATE users
                    SET stripe_customer_id=?
                    WHERE id=?
                    `,
                    [
                        customerId,
                        userId
                    ]
                );

            }

            console.log("🔥 FRONT_URL:", FRONT_URL);
            console.log("🔥 PLAN:", plan);
            console.log("🔥 PRICE ID:", priceId);
            console.log("🔥 YEARLY:", isYearly);

            const session =
                await stripe.checkout.sessions.create({

                    mode: "subscription",

                    customer: customerId,

                    payment_method_types: [
                        "card"
                    ],

                    line_items: [
                        {
                            price: priceId,
                            quantity: 1
                        }
                    ],

                    metadata: {
                        userId: String(userId),
                        plan,
                        billing: isYearly
                            ? "yearly"
                            : "monthly"
                    },

                    subscription_data: {
                        metadata: {
                            userId: String(userId),
                            plan
                        },
                        trial_period_days: 3
                    },

                    success_url:
                        `${FRONT_URL}/dashboard`,

                    cancel_url:
                        `${FRONT_URL}/pricing`
                });

            console.log(
                "✅ STRIPE SESSION URL:",
                session.url
            );

            console.log(
                "✅ STRIPE SESSION ID:",
                session.id
            );

            return res.json({

                success: true,

                url: session.url

            });
        }

        catch (error) {

            console.error("🔥 STRIPE FULL ERROR");
            console.error(error);

            console.error(
                "🔥 MESSAGE:",
                error.message
            );

            console.error(
                "🔥 TYPE:",
                error.type
            );

            console.error(
                "🔥 CODE:",
                error.code
            );

            console.error(
                "🔥 STACK:",
                error.stack
            );

            return res.status(500).json({

                success: false,

                error:
                    error.message ||
                    "Stripe checkout failed"

            });

        }

    }
);
export default router;