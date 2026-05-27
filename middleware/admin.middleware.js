import db from "../config/database.js";

/* ========================= */
/* ADMIN MIDDLEWARE */
/* ========================= */

export const adminMiddleware =
    async (req, res, next) => {

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
            /* USER */
            /* ========================= */

            const user =

                await db.get(

                    `

    SELECT

    id,

    role,

    plan

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

            /* ========================= */
            /* ADMIN CHECK */
            /* ========================= */

            if (
                user.role !== "admin"
            ) {

                return res
                    .status(403)
                    .json({

                        error:
                            "Admin only"

                    });

            }

            /* ========================= */
            /* ATTACH USER */
            /* ========================= */

            req.admin = user;

            next();

        }

        catch (err) {

            console.error(

                "ADMIN:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Server error"

                });

        }

    };