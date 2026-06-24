import express from "express";
import rateLimit from "express-rate-limit";

import {
    register,
    login,
    getUser
} from "../controllers/auth.controller.js";

import {
    authMiddleware
} from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* ENV */
/* ========================= */

const isProd = process.env.NODE_ENV === "production";

/* ========================= */
/* RATE LIMIT */
/* ========================= */

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: isProd ? 10 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        error: "Trop de tentatives de connexion. Réessayez plus tard."
    }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1h
    max: isProd ? 20 : 200,
    standardHeaders: true,
    legacyHeaders: false,

    // Ne compte pas les inscriptions réussies
    skipSuccessfulRequests: true,

    message: {
        error: "Trop de créations de compte depuis cette connexion. Réessayez plus tard."
    }
});

/* ========================= */
/* ROUTES */
/* ========================= */

router.post(
    "/register",
    registerLimiter,
    register
);

router.post(
    "/login",
    loginLimiter,
    login
);

router.get(
    "/me",
    authMiddleware,
    getUser
);

/* ========================= */
/* DEV GOOGLE CALLBACK */
/* ========================= */

if (process.env.NODE_ENV === "development") {
    router.get(
        "/google/callback",
        rateLimit({
            windowMs: 60000,
            max: 10
        }),
        async (req, res) => {
            const code = String(req.query.code || "").slice(0, 500);

            if (!code) {
                return res.status(400).send("Missing code");
            }

            console.log("GOOGLE CALLBACK RECEIVED");

            return res.send(`
<h2>Google callback reçu ✅</h2>
<p>Code récupéré</p>
`);
        }
    );
}

/* ========================= */
/* EXPORT */
/* ========================= */

export default router;