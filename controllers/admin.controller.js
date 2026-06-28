import db from "../config/database.js";

/* ========================= */
/* ADMIN STATS */
/* ========================= */

export const getAdminStats = async (
    req,
    res
) => {

    try {

        /* ========================= */
        /* ADMIN CHECK */
        /* ========================= */

        const user =
            await db.get(

                `
                SELECT
                    id,
                    email,
                    role
                FROM users
                WHERE id=?
                `,

                [req.user.id]

            );

        if (
            !user ||
            user.role !== "admin"
        ) {

            return res.status(403).json({

                error:
                    "Accès refusé"

            });

        }

        /* ========================= */
        /* USERS */
        /* ========================= */

        const users =
            await db.get(`

            SELECT COUNT(*) as total

            FROM users

        `);

        /* ========================= */
        /* PLANS */
        /* ========================= */

        const plans =
            await db.all(`

            SELECT
                plan,
                COUNT(*) as count

            FROM users

            GROUP BY plan

        `);

        /* ========================= */
        /* ANALYSES */
        /* ========================= */

        const analyses =
            await db.get(`

            SELECT
                COUNT(*) as total

            FROM keywords

            WHERE deleted=0

            AND strftime(
                '%Y-%m',
                created_at
            ) = strftime(
                '%Y-%m',
                'now'
            )

        `);

        /* ========================= */
        /* AI */
        /* ========================= */

        const ai =
            await db.get(`

            SELECT
                COUNT(*) as total

            FROM ai_usage

        `);

        /* ========================= */
        /* REVENUE */
        /* ========================= */

        const proUsers =
            plans.find(

                p =>
                    p.plan === "PRO"

            )?.count || 0;


        const businessUsers =
            plans.find(

                p =>
                    p.plan === "BUSINESS"

            )?.count || 0;


        const revenue =

            (proUsers * 19)

            +

            (businessUsers * 39);

        /* ========================= */
        /* RESPONSE */
        /* ========================= */

        res.json({

            users:
                users.total || 0,

            plans,

            analyses:
                analyses.total || 0,

            ai:
                ai.total || 0,

            revenue,

            generatedAt:
                new Date()
                    .toISOString()

        });

    }

    catch (error) {

        console.error(
            "ADMIN ERROR:",
            error
        );

        res.status(500).json({

            error:
                "Admin error"

        });

    }

};