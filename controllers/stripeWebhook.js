import Stripe from "stripe";
import db from "../config/database.js";

/* ========================= */
/* STRIPE */
/* ========================= */

if (
    !process.env.STRIPE_SECRET_KEY
) {

    throw new Error(
        "Missing STRIPE_SECRET_KEY"
    );

}

if (
    !process.env.STRIPE_WEBHOOK_SECRET
) {

    throw new Error(
        "Missing STRIPE_WEBHOOK_SECRET"
    );

}

const stripe =
    new Stripe(
        process.env.STRIPE_SECRET_KEY
    );

/* ========================= */
/* IDEMPOTENCY */
/* ========================= */

const isEventProcessed =
    async (eventId) => {

        const existing =

            await db.get(

                `

SELECT id

FROM stripe_events

WHERE event_id=?

LIMIT 1

`,

                [eventId]

            );

        return !!existing;

    };

const saveEvent =
    async (eventId) => {

        await db.run(

            `

INSERT INTO stripe_events(

event_id,

created_at

)

VALUES(

?,

datetime('now')

)

`,

            [eventId]

        );

    };

/* ========================= */
/* PLAN */
/* ========================= */

const getPlanFromPrice =
    (priceId) => {

        if (

            [

                process.env
                    .STRIPE_PRICE_PRO_MONTHLY,

                process.env
                    .STRIPE_PRICE_PRO_YEARLY

            ]

                .includes(
                    priceId
                )

        ) {

            return "PRO";

        }

        if (

            [

                process.env
                    .STRIPE_PRICE_BUSINESS_MONTHLY,

                process.env
                    .STRIPE_PRICE_BUSINESS_YEARLY

            ]

                .includes(
                    priceId
                )

        ) {

            return "BUSINESS";

        }

        return "FREE";

    };

/* ========================= */
/* WEBHOOK */
/* ========================= */

export const stripeWebhook =
    async (req, res) => {

        const sig =
            req.headers[
            "stripe-signature"
            ];

        let event;

        try {

            event =

                stripe
                    .webhooks
                    .constructEvent(

                        req.body,

                        sig,

                        process.env
                            .STRIPE_WEBHOOK_SECRET

                    );

        }

        catch (err) {

            console.error(

                "SIGNATURE:",

                err.message

            );

            return res
                .status(400)
                .send(

                    `Webhook Error:
${err.message}`

                );

        }

        try {

            /* ========================= */
            /* IDEMPOTENT */
            /* ========================= */

            if (

                await isEventProcessed(
                    event.id
                )

            ) {

                return res.json({

                    received: true

                });

            }

            if (
                process.env.NODE_ENV
                === "development"
            ) {

                console.log(
                    "EVENT:",
                    event.type
                );

            }

            /* ========================= */
            /* EVENTS */
            /* ========================= */

            switch (
            event.type
            ) {

                case
                    "checkout.session.completed": {

                        const session =
                            event.data.object;

                        const userId =

                            session.metadata
                                ?.userId;

                        if (
                            !userId ||
                            !session.subscription
                        ) {

                            break;

                        }

                        const subscription =

                            await stripe
                                .subscriptions
                                .retrieve(

                                    session.subscription

                                );

                        const priceId =

                            subscription
                                ?.items
                                ?.data?.[0]
                                ?.price
                                ?.id;

                        if (
                            !priceId
                        ) {

                            break;

                        }

                        const plan =
                            getPlanFromPrice(
                                priceId
                            );

                        await db.run(

                            `

UPDATE users

SET

plan=?,

subscription_id=?,

subscription_status='active'

WHERE id=?

`,

                            [

                                plan,

                                subscription.id,

                                userId

                            ]

                        );

                        break;

                    }

                case
                    "invoice.paid": {

                        const invoice =
                            event.data.object;

                        await db.run(

                            `

UPDATE users

SET
subscription_status='active'

WHERE subscription_id=?

`,

                            [

                                invoice
                                    .subscription

                            ]

                        );

                        break;

                    }

                case
                    "invoice.payment_failed": {

                        const invoice =
                            event.data.object;

                        await db.run(

                            `

UPDATE users

SET
subscription_status='past_due'

WHERE subscription_id=?

`,

                            [

                                invoice
                                    .subscription

                            ]

                        );

                        break;

                    }

                case
                    "customer.subscription.deleted": {

                        const subscription =
                            event.data.object;

                        await db.run(

                            `

UPDATE users

SET

plan='FREE',

subscription_status='cancelled'

WHERE subscription_id=?

`,

                            [

                                subscription.id

                            ]

                        );

                        break;

                    }

                default:

                    break;

            }

            /* ========================= */
            /* SAVE EVENT */
            /* ========================= */

            await saveEvent(
                event.id
            );

            /* ========================= */
            /* CLEAN OLD */
            /* ========================= */

            await db.run(

                `

DELETE

FROM stripe_events

WHERE created_at

<

datetime(
'now',
'-30 day'
)

`

            );

            return res.json({

                received: true

            });

        }

        catch (error) {

            console.error(

                "WEBHOOK:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Webhook failed"

                });

        }

    };