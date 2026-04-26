import express from "express";

import {
    generateAIKeywords,
    getKeywordSuggestions,
    analyzeKeyword,
    getUsage,
    getKeywordHistory,
    deleteKeyword
} from "../controllers/keyword.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
console.log("🔥 KEYWORD ROUTES FILE LOADED");
const router = express.Router();

/* ========================= */
/* 🔓 PUBLIC */
/* ========================= */

// Suggestions sans auth
router.post("/suggestions", getKeywordSuggestions);

/* ========================= */
/* 🔒 DEBUG GLOBAL */
/* ========================= */

router.use((req, res, next) => {
    console.log("📡 KEYWORD ROUTE:", req.method, req.originalUrl);
    next();
});

/* ========================= */
/* 🔒 PROTECTED */
/* ========================= */

// AI keywords
router.post("/ai", authMiddleware, generateAIKeywords);

// Analyse SEO (compteur + save)
router.post("/analyze", authMiddleware, analyzeKeyword);

/* ========================= */
/* 📊 USAGE (FIX IMPORTANT) */
/* ========================= */

// ✅ ON UTILISE LE CONTROLLER (et pas du code inline)
router.get("/usage", authMiddleware, getUsage);

/* ========================= */
/* 📜 HISTORY */
/* ========================= */

router.get("/history", authMiddleware, getKeywordHistory);

/* ========================= */
/* 🗑 DELETE */
/* ========================= */

router.delete("/:id", authMiddleware, deleteKeyword);

export default router;