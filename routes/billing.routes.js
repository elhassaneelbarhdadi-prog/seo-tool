import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
    createCheckout,
    createPortal,
    stripeWebhook
} from "../controllers/billing.controller.js";

const router = express.Router();

/* ========================= */
/* 💳 CHECKOUT */
/* ========================= */
router.post("/checkout", authMiddleware, createCheckout);

/* ========================= */
/* 💳 CUSTOMER PORTAL */
/* ========================= */
router.post("/portal", authMiddleware, createPortal);

/* ========================= */
/* 🔔 STRIPE WEBHOOK (NO AUTH) */
/* ========================= */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    stripeWebhook
);

export default router;