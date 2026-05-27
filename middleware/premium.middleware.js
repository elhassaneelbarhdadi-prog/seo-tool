/* ========================= */
/* DEFAULTS */
/* ========================= */

const DEFAULT_PREMIUM_PLANS =

    Object.freeze([

        "PRO",

        "BUSINESS"

    ]);

/* ========================= */
/* PREMIUM */
/* ========================= */

export const premiumMiddleware =
    (
        requiredPlans =
            DEFAULT_PREMIUM_PLANS
    ) => {

        return (
            req,
            res,
            next
        ) => {

            try {

                /* ========================= */
                /* AUTH */
                /* ========================= */

                if (
                    !req.user
                ) {

                    return res
                        .status(401)
                        .json({

                            error:
                                "Unauthorized"

                        });

                }

                /* ========================= */
                /* SAFE */
                /* ========================= */

                const plan =

                    String(

                        req.user.plan
                        ||
                        "FREE"

                    )

                        .trim()

                        .toUpperCase();

                const status =

                    String(

                        req.user
                            .subscription_status

                        ||

                        "inactive"

                    )

                        .trim()

                        .toLowerCase();

                const role =

                    String(

                        req.user.role
                        ||
                        "user"

                    )

                        .trim()

                        .toLowerCase();

                /* ========================= */
                /* ADMIN */
                /* ========================= */

                if (
                    role === "admin"
                ) {

                    req.isPremium = true;
                    req.isBusiness = true;

                    return next();

                }

                /* ========================= */
                /* NORMALIZE */
                /* ========================= */

                const allowedPlans =

                    Array.isArray(
                        requiredPlans
                    )

                        ?

                        requiredPlans
                            .map(

                                p =>

                                    String(p)
                                        .toUpperCase()

                            )

                        :

                        DEFAULT_PREMIUM_PLANS;

                /* ========================= */
                /* FREE */
                /* ========================= */

                if (
                    plan === "FREE"
                ) {

                    req.isFreeUser = true;

                    req.isPremium = false;

                    req.isBusiness = false;

                    if (
                        allowedPlans.length > 0
                    ) {

                        return res
                            .status(403)
                            .json({

                                error:
                                    "Upgrade required",

                                currentPlan:
                                    "FREE"

                            });

                    }

                    return next();

                }

                /* ========================= */
                /* SUB */
                /* ========================= */

                if (
                    status !== "active"
                ) {

                    return res
                        .status(403)
                        .json({

                            error:
                                "Subscription inactive"

                        });

                }

                /* ========================= */
                /* PLAN */
                /* ========================= */

                if (

                    !allowedPlans
                        .includes(
                            plan
                        )

                ) {

                    return res
                        .status(403)
                        .json({

                            error:
                                "Upgrade required",

                            currentPlan:
                                plan,

                            requiredPlans:
                                allowedPlans

                        });

                }

                /* ========================= */
                /* FLAGS */
                /* ========================= */

                req.isFreeUser = false;

                req.isPremium = true;

                req.isBusiness =

                    plan === "BUSINESS";

                next();

            }

            catch (err) {

                console.error(

                    "PREMIUM:",

                    err.message

                );

                return res
                    .status(500)
                    .json({

                        error:
                            "Internal server error"

                    });

            }

        };

    };