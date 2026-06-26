import express from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* GET BUSINESS PROFILES */
/* ========================= */

router.get("/", async (req, res) => {

    try {

        const search = req.query.search || "";

        let businesses;

        if (search.trim()) {

            businesses = await db.all(
                `
                SELECT *
                FROM business_profiles
                WHERE
                    name LIKE ?
                    OR keyword LIKE ?
                    OR city LIKE ?
                ORDER BY score DESC
                `,
                [
                    `%${search}%`,
                    `%${search}%`,
                    `%${search}%`
                ]
            );

        } else {

            businesses = await db.all(
                `
                SELECT *
                FROM business_profiles
                ORDER BY score DESC
                `
            );

        }

        return res.json({
            businesses
        });

    } catch (err) {

        console.error(
            "GET BUSINESS PROFILES ERROR:",
            err
        );

        return res.status(500).json({
            error: "Server error"
        });

    }

});

/* ========================= */
/* CREATE BUSINESS PROFILE */
/* ========================= */

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            /* ========================= */
            /* USER */
            /* ========================= */

            const user = await db.get(
                `
                SELECT
                    id,
                    plan,
                    subscription_status
                FROM users
                WHERE id = ?
                `,
                [req.user.id]
            );

            if (!user) {

                return res.status(404).json({
                    error: "Utilisateur introuvable"
                });

            }

            /* ========================= */
            /* PLAN CHECK */
            /* ========================= */

            const paidPlans = ["PRO", "BUSINESS"];

            if (

                !paidPlans.includes(
                    String(user.plan || "").toUpperCase()
                )

                ||

                user.subscription_status !== "active"

            ) {

                return res.status(403).json({

                    error: "PLAN_REQUIRED",

                    message:
                        "La publication dans l'annuaire est réservée aux abonnements PRO.",

                    upgrade: true

                });

            }

            /* ========================= */
            /* BODY */
            /* ========================= */

            const {

                name,

                description,

                keyword,

                city

            } = req.body;

            if (

                !name ||

                !description ||

                !keyword ||

                !city

            ) {

                return res.status(400).json({

                    error: "Tous les champs sont obligatoires"

                });

            }

            /* ========================= */
            /* INSERT */
            /* ========================= */

            const result = await db.run(

                `
                INSERT INTO business_profiles (

                    user_id,

                    name,

                    description,

                    keyword,

                    city

                )

                VALUES (?, ?, ?, ?, ?)
                `,

                [

                    req.user.id,

                    name.trim(),

                    description.trim(),

                    keyword.trim(),

                    city.trim()

                ]

            );

            return res.json({

                success: true,

                id: result.lastID

            });

        }

        catch (err) {

            console.error(

                "CREATE BUSINESS PROFILE ERROR:",

                err

            );

            return res.status(500).json({

                error: "Server error"

            });

        }

    }

);

export default router;