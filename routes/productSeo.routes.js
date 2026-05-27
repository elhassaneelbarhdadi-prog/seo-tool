import express from "express";
import rateLimit from "express-rate-limit";

import {
    authMiddleware
} from "../middleware/auth.middleware.js";

import {
    usageMiddleware
} from "../middleware/usage.middleware.js";

import {
    getProductsSeo
} from "../controllers/productSeo.controller.js";

const router =
    express.Router();

/* ========================= */
/* RATE LIMIT */
/* ========================= */

const productLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 30,

        standardHeaders: true,

        legacyHeaders: false,

        message: {

            success: false,

            error:
                "Too many requests"

        }

    });

/* ========================= */
/* DEV LOG */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.use(

        (req, res, next) => {

            console.log(

                "📡 PRODUCT:",

                req.method,

                req.originalUrl

            );

            next();

        }

    );

}

/* ========================= */
/* PRODUCT SEO */
/* ========================= */

/*
POST car getProductsSeo()
utilise req.body.keywords
*/

router.post(

    "/products",

    authMiddleware,

    usageMiddleware(
        "keywords"
    ),

    productLimiter,

    getProductsSeo

);

/* ========================= */
/* DEV HEALTH */
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
                    "product-seo"

            });

        }

    );

}

export default router;