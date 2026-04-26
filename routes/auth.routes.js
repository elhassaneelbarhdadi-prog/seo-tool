import express from "express";
import { register, login, getUser } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

/* 🔒 Anti brute force */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts"
});

/* ROUTES */
router.post("/register", register);
router.post("/login", loginLimiter, login); // ✅ FIX
router.get("/me", authMiddleware, getUser);

export default router;