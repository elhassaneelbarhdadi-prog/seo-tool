import Stripe from "stripe";
import db from "../config/database.js";

/* ========================= */
/* STRIPE INIT */
/* ========================= */

if (!process.env.STRIPE_SECRET_KEY) {

    throw new Error(
        "STRIPE_SECRET_KEY manquant"
    );

}

if (!process.env.FRONT_URL) {

    throw new Error(
        "FRONT_URL manquant"
    );

}

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);

/* ========================= */
/* PRICE MAP */
/* ========================= */

const PRICE_MAP = {

    PRO: {

        monthly:
            process.env
                .STRIPE_PRICE_PRO_MONTHLY,

        yearly:
            process.env
                .STRIPE_PRICE_PRO_YEARLY

    },

    BUSINESS: {

        monthly:
            process.env
                .STRIPE_PRICE_BUSINESS_MONTHLY,

        yearly:
            process.env
                .STRIPE_PRICE_BUSINESS_YEARLY

    }

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
        of Object.keys(
            PRICE_MAP
        )
    ) {

        const p =
            PRICE_MAP[plan];

        if (
            !p.monthly ||
            !p.yearly
        ) {

            console.warn(

                `⚠️ Stripe price missing: ${plan}`

            );

        }

    }

}

/* ========================= */
/* CHECKOUT */
/* ========================= */

export const createCheckout =
    async (req, res) => {

        try {

            const userId =
                req.user?.id;

            let {

                plan,

                billing =
                "monthly"

            } = req.body;

            if (
                !userId
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Unauthorized"

                    });

            }

            plan =
                String(plan)
                    ?.trim()
                    ?.toUpperCase();

            billing =
                String(billing)
                    ?.trim()
                    ?.toLowerCase();

            if (

                !["monthly", "yearly"]
                    .includes(
                        billing
                    )

            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Invalid billing"

                    });

            }

            if (
                !PRICE_MAP[plan]
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Invalid plan"

                    });

            }

            const priceId =
                PRICE_MAP[
                plan
                ][
                billing
                ];

            if (
                !priceId
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Price missing"

                    });

            }

            /* ========================= */
            /* USER */
            /* ========================= */

            const user =
                await db.get(

                    `
        SELECT

        email,

        stripe_customer_id

        FROM users

        WHERE id=?

        `,

                    [userId]

                );

            if (
                !user
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "User not found"

                    });

            }

            if (
                !user.email
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Email missing"

                    });

            }

            let customerId =
                user
                    .stripe_customer_id;

            /* ========================= */
            /* CREATE CUSTOMER */
            /* ========================= */

            if (
                !customerId
            ) {

                const customer =

                    await stripe
                        .customers
                        .create({

                            email:
                                user.email,

                            metadata: {

                                userId:
                                    String(
                                        userId
                                    )

                            }

                        });

                customerId =
                    customer.id;

                await db.run(

                    `
            UPDATE users

            SET
            stripe_customer_id=?

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

            const session =

                await stripe
                    .checkout
                    .sessions
                    .create({

                        customer:
                            customerId,

                        mode:
                            "subscription",

                        line_items: [

                            {

                                price:
                                    priceId,

                                quantity:
                                    1

                            }

                        ],

                        metadata: {

                            userId:
                                String(
                                    userId
                                ),

                            plan,

                            billing

                        },

                        subscription_data: {

                            metadata: {

                                userId:
                                    String(
                                        userId
                                    ),

                                plan,

                                billing

                            }

                        },

                        success_url:

                            `${process.env.FRONT_URL}/dashboard?success=true`,

                        cancel_url:

                            `${process.env.FRONT_URL}/pricing?cancel=true`

                    },

                        {

                            idempotencyKey:
                                `${userId}-${plan}-${billing}`

                        });

            return res.json({

                url:
                    session.url

            });

        }

        catch (error) {

            console.error(

                "STRIPE ERROR:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Stripe checkout error"

                });

        }

    };/* ========================= */
/* STRIPE WEBHOOK */
/* ========================= */

/* ========================= */
/* STRIPE WEBHOOK */
/* ========================= */

export const stripeWebhook = async (req, res) => {

    console.log("🔥 WEBHOOK RECEIVED");
    console.log("🔥 URL:", req.originalUrl);
    console.log("🔥 METHOD:", req.method);

    console.log(
        "🔥 SIGNATURE:",
        req.headers["stripe-signature"]
    );

    console.log(
        "🔥 BODY IS BUFFER:",
        Buffer.isBuffer(req.body)
    );

    console.log(
        "🔥 BODY LENGTH:",
        req.body?.length
    );

    console.log(
        "🔥 WEBHOOK SECRET EXISTS:",
        !!process.env.STRIPE_WEBHOOK_SECRET
    );

    const sig =
        req.headers["stripe-signature"];

    if (!process.env.STRIPE_WEBHOOK_SECRET) {

        console.error(
            "❌ STRIPE_WEBHOOK_SECRET MISSING"
        );

        return res.status(500).json({
            error: "Webhook secret missing"
        });

    }

    let event;

    try {

        event =
            stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

        console.log(
            "🔥 EVENT:",
            event.type
        );

        console.log(
            "🔥 EVENT ID:",
            event.id
        );

    } catch (err) {

        console.error(
            "❌ SIGNATURE ERROR:",
            err.message
        );

        console.error(err);

        return res
            .status(400)
            .send(
                `Webhook Error: ${err.message}`
            );

    }

    try {

        switch (event.type) {

            case "checkout.session.completed":

                console.log(
                    "✅ CHECKOUT COMPLETED"
                );

                console.log(
                    event.data.object
                );

                break;

            case "invoice.paid":

                console.log(
                    "💰 INVOICE PAID"
                );

                console.log(
                    event.data.object.id
                );

                break;

            case "invoice.payment_failed":

                console.log(
                    "❌ PAYMENT FAILED"
                );

                console.log(
                    event.data.object.id
                );

                break;

            case "customer.subscription.deleted":

                console.log(
                    "🚫 SUBSCRIPTION DELETED"
                );

                console.log(
                    event.data.object.id
                );

                break;

            default:

                console.log(
                    "ℹ️ UNHANDLED EVENT:",
                    event.type
                );

        }

        return res.json({
            received: true
        });

    } catch (error) {

        console.error(
            "🔥 WEBHOOK ERROR:"
        );

        console.error(error);

        return res
            .status(500)
            .json({
                error: "Webhook failed"
            });

    }

};