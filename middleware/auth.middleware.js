import jwt from "jsonwebtoken";
import db from "../config/database.js";

/* ========================= */
/* ENV CHECK */
/* ========================= */

if (!process.env.JWT_SECRET) {

    throw new Error(
        "JWT_SECRET manquant"
    );

}

const JWT_SECRET =
    process.env.JWT_SECRET;

/* ========================= */
/* AUTH */
/* ========================= */

export const authMiddleware =
    async (req, res, next) => {


        try {

            /* ========================= */
            /* HEADER */
            /* ========================= */

            const authHeader =

                req.headers.authorization;

            if (

                !authHeader ||

                !authHeader.startsWith(
                    "Bearer "
                )

            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Unauthorized"

                    });

            }

            const parts =

                authHeader
                    .split(" ");

            if (
                parts.length !== 2
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Invalid auth format"

                    });

            }

            const token =
                parts[1];

            if (

                !token ||

                typeof token
                !== "string"

            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Missing token"

                    });

            }

            /* ========================= */
            /* VERIFY */
            /* ========================= */

            const decoded =

                jwt.verify(

                    token,

                    JWT_SECRET

                );

            if (
                !decoded?.id
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Invalid token payload"

                    });

            }

            /* ========================= */
            /* USER */
            /* ========================= */

            const user =

                await db.get(

                    `

    SELECT

    id,

    email,

    role,

    plan,

    subscription_status

    FROM users

    WHERE id=?

    LIMIT 1

    `,

                    [

                        decoded.id

                    ]

                );

            if (
                !user
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "User not found"

                    });

            }

            /* ========================= */
            /* FLAGS */
            /* ========================= */

            const hasActiveSubscription =

                user.plan !== "FREE"

                &&

                user.subscription_status
                === "active";

            req.user = {

                id:
                    user.id,

                email:
                    user.email,

                role:
                    user.role,

                plan:
                    user.plan,

                subscription_status:
                    user.subscription_status,

                isPaid:
                    hasActiveSubscription,

                isAdmin:
                    user.role === "admin"

            };

            next();

        }

        catch (error) {

            if (

                error.name ===
                "TokenExpiredError"

            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Token expired"

                    });

            }

            if (

                error.name ===
                "JsonWebTokenError"

            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Invalid token"

                    });

            }

            console.error(

                "AUTH:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Authentication failed"

                });

        }

    };