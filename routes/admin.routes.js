import express from "express";

import { authMiddleware }
    from "../middleware/auth.middleware.js";

import { adminMiddleware }
    from "../middleware/admin.middleware.js";

import {
    getAdminStats
}
    from "../controllers/admin.controller.js";

const router =
    express.Router();

/* ========================= */
/* ADMIN STATS */
/* ========================= */

router.get(

    "/stats",

    authMiddleware,

    adminMiddleware,

    getAdminStats

);

/* ========================= */
/* ADMIN TEST */
/* ========================= */

router.get(

    "/test",

    authMiddleware,

    adminMiddleware,

    (req, res) => {

        return res.json({

            message:
                "Admin access OK 🔥",

            user: {

                id:
                    req.user.id,

                email:
                    req.user.email,

                role:
                    req.user.role

            }

        });

    }

);

/* ========================= */
/* HEALTH */
/* ========================= */

router.get(

    "/health",

    (req, res) => {

        return res.json({

            ok: true,

            service:
                "admin",

            timestamp:
                new Date()
                    .toISOString()

        });

    }

);

export default router;