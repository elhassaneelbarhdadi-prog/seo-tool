import express from "express";
import rateLimit from "express-rate-limit";

import {

    createCheckout,

    billingPortal,

    stripeWebhook

}

    from "../controllers/billing.controller.js";

import {

    authMiddleware

}

    from "../middleware/auth.middleware.js";

const router =
    express.Router();

/* ========================= */
/* LIMITERS */
/* ========================= */

const checkoutLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 10,

        message: {

            error:
                "Too many checkout attempts"

        }

    });

const portalLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 20,

        message: {

            error:
                "Too many portal requests"

        }

    });

/* ========================= */
/* CHECKOUT */
/* ========================= */

router.post(

    "/checkout",

    authMiddleware,

    checkoutLimiter,

    createCheckout

);

/* ========================= */
/* BILLING PORTAL */
/* ========================= */

router.post(

    "/portal",

    authMiddleware,

    portalLimiter,

    billingPortal

);

/* ========================= */
/* WEBHOOK */
/* ========================= */

/*

IMPORTANT:

- jamais authMiddleware
- express.raw obligatoire
- avant express.json()

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

if (
    process.env.NODE_ENV
    === "development"
) {

    router.get(

        "/health",

        (req, res) => {

            res.json({

                ok: true,

                service:
                    "stripe",

                timestamp:
                    new Date()
                        .toISOString()

            });

        }

    );

}

/* ========================= */
/* EXPORT */
/* ========================= */

export default router;