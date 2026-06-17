import express from "express";
import db from "../config/database.js";

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
router.post("/", async (req, res) => {

    try {

        const {
            user_id,
            name,
            description,
            keyword,
            city
        } = req.body;

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
                user_id || null,
                name,
                description,
                keyword,
                city
            ]
        );

        return res.json({
            success: true,
            id: result.lastID
        });

    } catch (err) {

        console.error(
            "CREATE BUSINESS PROFILE ERROR:",
            err
        );

        return res.status(500).json({
            error: "Server error"
        });

    }

});

export default router;