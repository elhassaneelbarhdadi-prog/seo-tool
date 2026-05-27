/* ========================= */
/* PRO ACCESS */
/* ========================= */

const PRO_PLANS =

    Object.freeze([

        "PRO",

        "BUSINESS"

    ]);

const proMiddleware =
    (
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
            /* ADMIN BYPASS */
            /* ========================= */

            if (
                role === "admin"
            ) {

                return next();

            }

            /* ========================= */
            /* ACTIVE SUB */
            /* ========================= */

            if (
                plan !== "FREE"
                &&
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

                !PRO_PLANS
                    .includes(
                        plan
                    )

            ) {

                return res
                    .status(403)
                    .json({

                        error:
                            "PRO plan required",

                        currentPlan:
                            plan

                    });

            }

            req.isPremium = true;

            next();

        }

        catch (error) {

            console.error(

                "PRO:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Access error"

                });

        }

    };

export default proMiddleware;