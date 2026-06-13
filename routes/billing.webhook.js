import express from "express";

import {
    stripeWebhook
}
    from "../controllers/billing.controller.js";

const router =
    express.Router();

/* ========================= */
/* DEBUG */
/* ========================= */

console.log(
    "🔥 BILLING WEBHOOK ROUTE LOADED"
);

/* ========================= */
/* STRIPE WEBHOOK */
/* ========================= */

/*

IMPORTANT

- jamais authMiddleware
- express.raw obligatoire
- route AVANT express.json()
- logique dans controller uniquement

*/

router.post(

    "/webhook",

    express.raw({

        type:
            "application/json",

        limit:
            "1mb"

    }),

    stripeWebhook

);

/* ========================= */
/* HEALTH */
/* ========================= */

router.get(

    "/health",

    (req, res) => {

        console.log(
            "🔥 HEALTH ROUTE CALLED"
        );

        return res.json({

            ok: true,

            service:
                "stripe-webhook",

            timestamp:
                new Date()
                    .toISOString()

        });

    }

);

export default router;