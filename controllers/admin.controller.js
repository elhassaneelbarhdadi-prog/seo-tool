import db from "../config/database.js";

export const getAdminStats = async (req, res) => {

    try {

        /* 🔐 CHECK ADMIN */

        const user = await db.get(
            "SELECT email FROM users WHERE id = ?",
            [req.user.id]
        );

        if (!user || user.email !== "TON_EMAIL@gmail.com") {
            return res.status(403).json({
                error: "Accès refusé (admin uniquement)"
            });
        }

        /* 👥 USERS */

        const users = await db.get(`
            SELECT COUNT(*) as total FROM users
        `);

        /* 💎 PLANS */

        const plans = await db.all(`
            SELECT plan, COUNT(*) as count
            FROM users
            GROUP BY plan
        `);

        /* 🔍 ANALYSES (MOIS) */

        const analyses = await db.get(`
            SELECT COUNT(*) as total
            FROM keywords
            WHERE deleted = 0
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        `);

        /* 🤖 IA */

        const ai = await db.get(`
            SELECT COUNT(*) as total
            FROM ai_usage
        `);

        /* 💰 REVENUE */

        const proUsers = plans.find(p => p.plan === "PRO")?.count || 0;
        const businessUsers = plans.find(p => p.plan === "BUSINESS")?.count || 0;

        const revenue =
            (proUsers * 19) +
            (businessUsers * 39);

        /* RESPONSE */

        res.json({
            users: users.total,
            plans,
            analyses: analyses.total,
            ai: ai.total,
            revenue
        });

    } catch (error) {

        console.error("ADMIN ERROR:", error);

        res.status(500).json({
            error: "Admin error"
        });

    }

};