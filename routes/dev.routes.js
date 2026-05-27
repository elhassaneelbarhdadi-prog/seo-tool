import express from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* DEV ACCESS */
/* ========================= */

const canUseDevRoute = (req) => {

    return (

        process.env.NODE_ENV
        === "development"

        ||

        req.user?.isAdmin
        === true

    );

};

/* ========================= */
/* GUARD */
/* ========================= */

const devGuard =
    (req, res, next) => {

        if (
            !canUseDevRoute(
                req
            )
        ) {

            return res
                .status(403)
                .json({

                    error:
                        "Forbidden"

                });

        }

        next();

    };

/* ========================= */
/* RESET USAGE */
/* ========================= */

router.post(

    "/reset-usage",

    authMiddleware,

    devGuard,

    async (
        req,
        res
    ) => {

        try {

            await db.run(

                `

DELETE

FROM ai_usage

WHERE user_id=?

`,

                [

                    req.user.id

                ]

            );

            return res.json({

                success: true,

                message:
                    "Usage reset"

            });

        }

        catch (error) {

            console.error(

                "RESET USAGE:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Reset error"

                });

        }

    }

);

/* ========================= */
/* RESET KEYWORDS */
/* ========================= */

router.post(

    "/reset-keywords",

    authMiddleware,

    devGuard,

    async (
        req,
        res
    ) => {

        try {

            /*
            
            soft delete
            
            cohérent avec ton architecture
            
            */

            await db.run(

                `

UPDATE keywords

SET deleted=1

WHERE user_id=?

`,

                [

                    req.user.id

                ]

            );

            return res.json({

                success: true,

                message:
                    "Keywords reset"

            });

        }

        catch (error) {

            console.error(

                "RESET KEYWORDS:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Reset keywords error"

                });

        }

    }

);

/* ========================= */
/* HEALTH */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.get(

        "/health",

        (req, res) => {

            return res.json({

                ok: true,

                service:
                    "dev",

                timestamp:
                    new Date()
                        .toISOString()

            });

        }

    );

}

export default router;