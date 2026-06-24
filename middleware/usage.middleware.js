import db from "../config/database.js";
import { getPlan } from "../config/plans.js";

export const usageMiddleware = (type = "keywords") => {
    return async (req, res, next) => {
        try {
            /* ========================= */
            /* AUTH */
            /* ========================= */
            if (!req.user?.id) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            /* ========================= */
            /* USER */
            /* ========================= */
            const user = await db.get(
                `
                SELECT
                    plan,
                    subscription_status
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [req.user.id]
            );

            if (!user) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            /* ========================= */
            /* PLAN */
            /* ========================= */
            const planKey = String(user.plan || "FREE")
                .trim()
                .toUpperCase();

            const plan = getPlan(planKey);

            console.log("🔥 USAGE CHECK");
            console.log("🔥 USER:", req.user.id);
            console.log("🔥 PLAN KEY:", planKey);
            console.log("🔥 SUB STATUS:", user.subscription_status);

            /* ========================= */
            /* SUBSCRIPTION */
            /* ========================= */
            if (
                planKey !== "FREE" &&
                user.subscription_status !== "active"
            ) {
                return res.status(403).json({
                    error: "Subscription inactive"
                });
            }

            /* ========================= */
            /* LIMIT */
            /* ========================= */
            const limit = plan?.limit;

            console.log("🔥 LIMIT:", limit);

            /* ========================= */
            /* UNLIMITED */
            /* ========================= */
            const isUnlimited =
                limit === null ||
                limit === undefined ||
                limit === Infinity ||
                limit === -1;

            if (isUnlimited) {
                console.log("🔥 UNLIMITED PLAN");
                return next();
            }

            /* ========================= */
            /* USAGE */
            /* ========================= */
            let usage = 0;

            /* ========================= */
            /* KEYWORDS => COUNT ONLY THIS MONTH */
            /* ========================= */
            if (type === "keywords") {
                const result = await db.get(
                    `
                    SELECT COUNT(*) as total
                    FROM keywords
                    WHERE user_id = ?
                    AND deleted = 0
                    AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
                    `,
                    [req.user.id]
                );

                usage = Number(result?.total || 0);

                console.log("🔥 KEYWORDS USED THIS MONTH:", usage);
            }

            /* ========================= */
            /* AI => COUNT ONLY THIS MONTH */
            /* ========================= */
            else if (type === "ai") {
                const result = await db.get(
                    `
                    SELECT COUNT(*) as total
                    FROM ai_usage
                    WHERE user_id = ?
                    AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
                    `,
                    [req.user.id]
                );

                usage = Number(result?.total || 0);

                console.log("🔥 AI USED THIS MONTH:", usage);
            }

            /* ========================= */
            /* UNKNOWN TYPE */
            /* ========================= */
            else {
                console.warn("⚠️ Unknown usage type:", type);
                usage = 0;
            }

            console.log("🔥 FINAL USAGE:", usage, "/", limit);

            /* ========================= */
            /* LIMIT REACHED */
            /* ========================= */
            if (usage >= Number(limit)) {
                return res.status(403).json({
                    error: "LIMIT_REACHED",
                    message: "Limite atteinte",
                    current: usage,
                    limit: Number(limit),
                    upgrade: true
                });
            }

            /* ========================= */
            /* IMPORTANT */
            /* ========================= */
            /*
            Le middleware vérifie uniquement la limite.
            Le comptage réel doit être fait dans analyzeKeyword()
            quand l'analyse réussit.
            */
            return next();
        } catch (err) {
            console.error("🔥 USAGE ERROR:", err);

            return res.status(500).json({
                error: "Usage middleware error",
                details:
                    process.env.NODE_ENV === "development"
                        ? err.message
                        : undefined
            });
        }
    };
};