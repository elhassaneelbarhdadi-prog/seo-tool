export const premiumMiddleware = (requiredPlans = ["PRO", "BUSINESS"]) => {

    return (req, res, next) => {

        try {

            if (!req.user) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const plan = req.user.plan || "FREE";
            const status = req.user.subscription_status || "inactive";

            /* ========================= */
            /* 🔥 FREE USER → LIMITED ACCESS */
            /* ========================= */

            if (plan === "FREE") {
                req.isFreeUser = true;   // 👈 IMPORTANT
                return next();           // ✅ NE BLOQUE PLUS
            }

            /* ========================= */
            /* 🚫 CHECK STATUS */
            /* ========================= */

            if (status !== "active") {

                console.log("⚠️ Subscription inactive");

                return res.status(403).json({
                    error: "Subscription inactive"
                });
            }

            /* ========================= */
            /* 🔐 CHECK PLAN */
            /* ========================= */

            if (!requiredPlans.includes(plan)) {

                console.log(`🚫 Access denied: ${plan}`);

                return res.status(403).json({
                    error: "Upgrade required",
                    currentPlan: plan,
                    requiredPlans
                });
            }

            /* ========================= */
            /* ✅ FULL ACCESS */
            /* ========================= */

            req.isFreeUser = false;
            next();

        } catch (err) {

            console.error("❌ PREMIUM ERROR:", err);

            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };
};