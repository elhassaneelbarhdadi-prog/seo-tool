import Stripe from "stripe";
import db from "../config/database.js";

/* ========================= */
/* STRIPE */
/* ========================= */

if (
    !process.env
        .STRIPE_SECRET_KEY
) {

    throw new Error(
        "STRIPE_SECRET_KEY manquant"
    );

}

if (
    !process.env
        .FRONT_URL
) {

    throw new Error(
        "FRONT_URL manquant"
    );

}

const stripe =
    new Stripe(
        process.env
            .STRIPE_SECRET_KEY
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
/* CHECKOUT */
/* ========================= */

export const createCheckoutSession =
    async (req, res) => {

        try {

            const userId =
                req.user?.id;

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

            let {

                plan,

                isYearly = false

            } = req.body;

            /* ========================= */
            /* VALIDATE */
            /* ========================= */

            plan =

                String(
                    plan || ""
                )

                    .trim()

                    .toUpperCase();

            isYearly =
                Boolean(
                    isYearly
                );

            if (
                !plan
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Missing plan"

                    });

            }

            if (
                !PRICE_MAP[
                plan
                ]
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Invalid plan"

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
                            "Missing email"

                    });

            }

            /* ========================= */
            /* ACTIVE */
            /* ========================= */

            if (

                user
                    .subscription_status
                === "active"

            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Already subscribed"

                    });

            }

            /* ========================= */
            /* CUSTOMER */
            /* ========================= */

            let customerId =

                user
                    .stripe_customer_id;

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
            /* PRICE */
            /* ========================= */

            const priceId =

                isYearly

                    ?

                    PRICE_MAP[
                        plan
                    ].yearly

                    :

                    PRICE_MAP[
                        plan
                    ].monthly;

            if (
                !priceId
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Price not configured"

                    });

            }

            /* ========================= */
            /* SESSION */
            /* ========================= */

            const session =

                await stripe
                    .checkout
                    .sessions
                    .create(

                        {

                            customer:
                                customerId,

                            mode:
                                "subscription",

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

                                trial_period_days:

                                    user
                                        .subscription_status

                                        ?

                                        undefined

                                        :

                                        3

                            },

                            success_url:

                                `${process.env.FRONT_URL}/success?success=true`,

                            cancel_url:

                                `${process.env.FRONT_URL}/pricing?cancel=true`

                        },

                        {

                            idempotencyKey:

                                `${userId}-${plan}-${isYearly}`

                        }

                    );

            return res.json({

                url:
                    session.url

            });

        }

        catch (error) {

            console.error(

                "CHECKOUT:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Stripe checkout failed"

                });

        }

    };