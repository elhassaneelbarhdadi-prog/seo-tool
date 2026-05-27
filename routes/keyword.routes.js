import express from "express";
import rateLimit from "express-rate-limit";

import {

    generateAIKeywords,

    getKeywordSuggestions,

    analyzeKeyword,

    getUsage,

    getKeywordHistory,

    deleteKeyword,

    deleteAllKeywords

} from "../controllers/keyword.controller.js";

import {

    authMiddleware

} from "../middleware/auth.middleware.js";

import {

    usageMiddleware

} from "../middleware/usage.middleware.js";

import {

    premiumMiddleware

} from "../middleware/premium.middleware.js";

const router =
    express.Router();

/* ========================= */
/* LIMITERS */
/* ========================= */

const publicLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 20,

        standardHeaders: true,

        legacyHeaders: false

    });

const privateLimiter =
    rateLimit({

        windowMs:
            60 * 1000,

        max: 60,

        standardHeaders: true,

        legacyHeaders: false

    });

/* ========================= */
/* DEV LOGS */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.use(

        (req, res, next) => {

            console.log(

                "📡 KEYWORD:",

                req.method,

                req.originalUrl

            );

            next();

        }

    );

}

/* ========================= */
/* PUBLIC */
/* ========================= */

router.post(

    "/suggestions",

    publicLimiter,

    getKeywordSuggestions

);

/* ========================= */
/* AI */
/* ========================= */

router.post(

    "/ai",

    authMiddleware,

    premiumMiddleware(),

    usageMiddleware("ai"),

    privateLimiter,

    generateAIKeywords

);

/* ========================= */
/* ANALYZE */
/* ========================= */

router.post(

    "/analyze",

    authMiddleware,

    usageMiddleware("keywords"),

    privateLimiter,

    analyzeKeyword

);

/* ========================= */
/* USAGE */
/* ========================= */

router.get(

    "/usage",

    authMiddleware,

    getUsage

);

/* ========================= */
/* HISTORY */
/* ========================= */

router.get(

    "/history",

    authMiddleware,

    getKeywordHistory

);

/* ========================= */
/* DELETE */
/* IMPORTANT:
routes spécifiques
avant routes dynamiques
*/
/* ========================= */

router.delete(

    "/all",

    authMiddleware,

    deleteAllKeywords

);

/*
ATTENTION:
PAS DE "/:id(\\d+)"
ça casse path-to-regexp
*/

router.delete(

    "/:id",

    authMiddleware,

    deleteKeyword

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

                service: "keywords"

            });

        }

    );

}

export default router;