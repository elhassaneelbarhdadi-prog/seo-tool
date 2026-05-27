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

const FRONT_URL =

    process.env.FRONT_URL
    ||
    "http://localhost:5173";

/* ========================= */
/* CHECKOUT */
/* ========================= */

router.post(

    "/checkout",

    authMiddleware,

    async (
        req,
        res
    ) => {

        try {

            const userId =
                req.user.id;

            let {

                plan,

                isYearly = false

            } = req.body;

            if (
                !plan
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Missing plan"

                    });

            }

            /* string -> bool safe */

            if (
                typeof isYearly
                === "string"
            ) {

                isYearly =
                    isYearly === "true";

            }

            plan =
                String(
                    plan
                )
                    .toUpperCase();

            const selectedPlan =
                PLANS[
                plan
                ];

            if (
                !selectedPlan
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Invalid plan"

                    });

            }

            const priceId =

                isYearly

                    ?

                    selectedPlan.yearlyPriceId

                    :

                    selectedPlan.monthlyPriceId;

            if (
                !priceId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Missing Stripe price"

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

            if (
                !user
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        error:
                            "User not found"

                    });

            }

            if (
                user.subscription_status
                === "active"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        error:
                            "Already subscribed"

                    });

            }

            let customerId =
                user.stripe_customer_id;

            /* ========================= */
            /* CUSTOMER */
            /* ========================= */

            if (
                !customerId
            ) {

                const customer =

                    await stripe
                        .customers
                        .create({

                            email:
                                user.email

                        });

                customerId =
                    customer.id;

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

            /* ========================= */
            /* SESSION */
            /* ========================= */
            console.log("🔥 FRONT_URL:", FRONT_URL);
            console.log("🔥 PLAN:", plan);
            console.log("🔥 PRICE ID:", priceId);
            console.log("🔥 YEARLY:", isYearly);
            const session =

                await stripe
                    .checkout
                    .sessions
                    .create({

                        mode:
                            "subscription",

                        customer:
                            customerId,

                        payment_method_types: [
                            "card"
                        ],

                        line_items: [

                            {

                                price:
                                    priceId,

                                quantity: 1

                            }

                        ],

                        metadata: {

                            userId:
                                String(
                                    userId
                                ),

                            plan,

                            billing:

                                isYearly
                                    ?
                                    "yearly"
                                    :
                                    "monthly"

                        },

                        subscription_data: {

                            metadata: {

                                userId:
                                    String(
                                        userId
                                    ),

                                plan

                            },

                            trial_period_days: 3

                        },

                        success_url:
                            `${FRONT_URL}/dashboard`,

                        cancel_url:
                            `${FRONT_URL}/pricing`

                    });

            return res.json({

                success: true,

                url:
                    session.url

            });

        }

        catch (error) {

            console.error("🔥 STRIPE FULL ERROR:");
            console.error(error);
            console.error("🔥 MESSAGE:", error.message);
            console.error("🔥 TYPE:", error.type);
            console.error("🔥 CODE:", error.code);
            console.error("🔥 RAW:", error.raw);

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        "Stripe checkout failed"

                });

        }

    }

);

export default router;