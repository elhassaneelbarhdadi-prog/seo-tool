import db from "../config/database.js";
import { getPlan } from "../config/plans.js";

/* ========================= */
/* VALID TYPES */
/* ========================= */

const VALID_TYPES = [

    "keywords",

    "ai"

];

/* ========================= */
/* USAGE */
/* ========================= */

export const usageMiddleware =
    (type = "keywords") => {

        return async (
            req,
            res,
            next
        ) => {

            try {

                /* ========================= */
                /* AUTH */
                /* ========================= */

                if (
                    !req.user?.id
                ) {

                    return res
                        .status(401)
                        .json({

                            error:
                                "Unauthorized"

                        });

                }

                /* ========================= */
                /* TYPE */
                /* ========================= */

                if (
                    !VALID_TYPES.includes(
                        type
                    )
                ) {

                    return res
                        .status(500)
                        .json({

                            error:
                                "Invalid middleware type"

                        });

                }

                /* ========================= */
                /* USER */
                /* ========================= */

                const user =

                    await db.get(

                        `

    SELECT

    plan,

    subscription_status

    FROM users

    WHERE id=?

    LIMIT 1

    `,

                        [req.user.id]

                    );

                if (
                    !user
                ) {

                    return res
                        .status(404)
                        .json({

                            error:
                                "User not found"

                        });

                }

                const planKey =

                    String(

                        user.plan
                        ||
                        "FREE"

                    )

                        .toUpperCase();

                const status =

                    user
                        .subscription_status

                    ||

                    "inactive";

                const plan =
                    getPlan(
                        planKey
                    );

                /* ========================= */
                /* SUB CHECK */
                /* ========================= */

                if (

                    planKey !== "FREE"

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
                /* UNLIMITED */
                /* ========================= */

                if (
                    plan.limit === null
                ) {

                    return next();

                }

                let usage = 0;

                /* ========================= */
                /* USAGE */
                /* ========================= */

                switch (type) {

                    case
                        "keywords": {

                            const result =

                                await db.get(

                                    `

            SELECT

            COUNT(*) as total

            FROM keywords

            WHERE

            user_id=?

            AND deleted=0

            `,

                                    [

                                        req.user.id

                                    ]

                                );

                            usage =
                                result?.total
                                || 0;

                            break;

                        }

                    case
                        "ai": {

                            const result =

                                await db.get(

                                    `

            SELECT

            COUNT(*) as total

            FROM ai_usage

            WHERE user_id=?

            AND strftime(

            '%Y-%m',

            created_at

            )

            =

            strftime(

            '%Y-%m',

            'now'

            )

            `,

                                    [

                                        req.user.id

                                    ]

                                );

                            usage =
                                result?.total
                                || 0;

                            break;

                        }

                }

                /* ========================= */
                /* LIMIT */
                /* ========================= */

                if (

                    usage >= plan.limit

                ) {

                    return res
                        .status(403)
                        .json({

                            error:
                                "LIMIT_REACHED",

                            message:
                                "Limite atteinte",

                            upgrade: true,

                            plan:
                                planKey,

                            limit:
                                plan.limit,

                            used:
                                usage

                        });

                }

                next();

            }

            catch (err) {

                console.error(

                    "USAGE:",

                    err.message

                );

                return res
                    .status(500)
                    .json({

                        error:
                            "Usage middleware error"

                    });

            }

        };

    };