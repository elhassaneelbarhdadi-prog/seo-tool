import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getAdminStats } from "../controllers/admin.controller.js";

const router = express.Router();

/* ========================= */
/* 🔐 ADMIN MIDDLEWARE */
/* ========================= */

const adminMiddleware = async (req, res, next) => {

    try {

        // sécurité basique (tu peux améliorer plus tard)
        if (!req.user?.id) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        // 👉 version simple par email
        // (évite bug si pas de role en DB)
        if (req.user.email !== "TON_EMAIL@gmail.com") {
            return res.status(403).json({
                error: "Accès refusé (admin uniquement)"
            });
        }

        next();

    } catch (error) {

        console.error("ADMIN MIDDLEWARE ERROR:", error);

        return res.status(500).json({
            error: "Admin middleware error"
        });

    }

};

/* ========================= */
/* 📊 ADMIN STATS */
/* ========================= */

router.get(
    "/stats",
    authMiddleware,
    adminMiddleware,
    getAdminStats
);

/* ========================= */
/* 🧪 TEST ADMIN (optionnel) */
/* ========================= */

router.get(
    "/test",
    authMiddleware,
    adminMiddleware,
    (req, res) => {
        res.json({
            message: "Admin access OK 🔥"
        });
    }
);

export default router;