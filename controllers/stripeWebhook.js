import Stripe from "stripe";
import db from "../config/database.js";

/* ========================= */
/* STRIPE */
/* ========================= */

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        "Missing STRIPE_SECRET_KEY"
    );
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error(
        "Missing STRIPE_WEBHOOK_SECRET"
    );
}

const stripe = new Stripe(
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
                process.env.STRIPE_PRICE_PRO_MONTHLY,
                process.env.STRIPE_PRICE_PRO_YEARLY
            ].includes(priceId)
        ) {
            return "PRO";
        }

        if (
            [
                process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
                process.env.STRIPE_PRICE_BUSINESS_YEARLY
            ].includes(priceId)
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

        console.log("🔥 WEBHOOK RECEIVED");
        console.log("🔥🔥🔥 WEBHOOK HIT");
        console.log("🔥 URL:", req.originalUrl);
        console.log("🔥 METHOD:", req.method);
        const sig =
            req.headers["stripe-signature"];

        let event;

        try {

            event =
                stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    process.env
                        .STRIPE_WEBHOOK_SECRET
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

            return res
                .status(400)
                .send(
                    `Webhook Error: ${err.message}`
                );
        }

        try {

            if (
                await isEventProcessed(
                    event.id
                )
            ) {

                console.log(
                    "⚠️ EVENT ALREADY PROCESSED:",
                    event.id
                );

                return res.json({
                    received: true
                });
            }

            switch (event.type) {

                case "checkout.session.completed": {

                    const session =
                        event.data.object;
                    console.log(
                        "🔥 FULL SESSION:",
                        JSON.stringify(session, null, 2)
                    );
                    console.log(
                        "🔥 SESSION METADATA:",
                        session.metadata
                    );

                    console.log(
                        "🔥 USER ID:",
                        session.metadata?.userId
                    );
                    console.log(
                        "🔥 CHECKOUT COMPLETED"
                    );

                    console.log(
                        "🔥 SESSION ID:",
                        session.id
                    );

                    console.log(
                        "🔥 SESSION METADATA:",
                        JSON.stringify(
                            session.metadata,
                            null,
                            2
                        )
                    );

                    console.log(
                        "🔥 SESSION SUBSCRIPTION:",
                        session.subscription
                    );

                    const userId =
                        session.metadata?.userId;

                    console.log(
                        "🔥 USER ID:",
                        userId
                    );

                    if (!userId) {

                        console.log(
                            "❌ USER ID MISSING"
                        );

                        break;
                    }

                    if (
                        !session.subscription
                    ) {

                        console.log(
                            "❌ SUBSCRIPTION MISSING"
                        );

                        break;
                    }

                    const subscription =
                        await stripe
                            .subscriptions
                            .retrieve(
                                session.subscription
                            );

                    console.log(
                        "🔥 SUBSCRIPTION:",
                        subscription.id
                    );

                    const priceId =
                        subscription
                            ?.items
                            ?.data?.[0]
                            ?.price
                            ?.id;

                    console.log(
                        "🔥 PRICE ID:",
                        priceId
                    );

                    if (!priceId) {

                        console.log(
                            "❌ PRICE ID MISSING"
                        );

                        break;
                    }

                    const plan =
                        getPlanFromPrice(
                            priceId
                        );

                    console.log(
                        "🔥 PLAN DETECTED:",
                        plan
                    );

                    const result =
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

                    console.log(
                        "🔥 UPDATE RESULT:",
                        result
                    );

                    const updatedUser =
                        await db.get(
                            `
SELECT
id,
email,
plan,
subscription_status,
subscription_id
FROM users
WHERE id=?
`,
                            [userId]
                        );

                    console.log(
                        "🔥 UPDATED USER:"
                    );

                    console.log(
                        updatedUser
                    );

                    break;
                }

                case "invoice.paid": {

                    const invoice =
                        event.data.object;

                    console.log(
                        "💰 INVOICE PAID:",
                        invoice.id
                    );

                    await db.run(
                        `
UPDATE users
SET subscription_status='active'
WHERE subscription_id=?
`,
                        [
                            invoice.subscription
                        ]
                    );

                    break;
                }

                case "invoice.payment_failed": {

                    const invoice =
                        event.data.object;

                    console.log(
                        "❌ PAYMENT FAILED:",
                        invoice.id
                    );

                    await db.run(
                        `
UPDATE users
SET subscription_status='past_due'
WHERE subscription_id=?
`,
                        [
                            invoice.subscription
                        ]
                    );

                    break;
                }

                case "customer.subscription.deleted": {

                    const subscription =
                        event.data.object;

                    console.log(
                        "🚫 SUBSCRIPTION DELETED:",
                        subscription.id
                    );

                    /*
                    IMPORTANT :
                
                    On conserve le plan PRO/BUSINESS
                    afin que le client garde l'accès
                    jusqu'à la fin de sa période payée.
                
                    On marque uniquement l'abonnement
                    comme annulé.
                    */

                    await db.run(
                        `
UPDATE users
SET
subscription_status='cancelled'
WHERE subscription_id=?
`,
                        [
                            subscription.id
                        ]
                    );

                    console.log(
                        "✅ Subscription cancelled but plan preserved"
                    );

                    break;
                }
                default:

                    console.log(
                        "ℹ️ UNHANDLED EVENT:",
                        event.type
                    );

                    break;
            }

            await saveEvent(
                event.id
            );

            console.log(
                "✅ EVENT SAVED:",
                event.id
            );

            await db.run(
                `
DELETE
FROM stripe_events
WHERE created_at <
datetime(
'now',
'-30 day'
)
`
            );

            return res.json({
                received: true
            });

        } catch (error) {

            console.error(
                "🔥 WEBHOOK ERROR:"
            );

            console.error(error);

            console.error(
                "🔥 MESSAGE:",
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