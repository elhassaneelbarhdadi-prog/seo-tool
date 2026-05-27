import express from "express";
import { PLANS } from "../config/plans.js";

const router =
    express.Router();

/* ========================= */
/* DEV LOG */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.use(

        (req, res, next) => {

            console.log(

                "📡 PLANS:",

                req.method,

                req.originalUrl

            );

            next();

        }

    );

}

/* ========================= */
/* GET PLANS */
/* ========================= */

router.get(

    "/",

    (req, res) => {

        try {

            const orderedPlans = [

                "FREE",

                "PRO",

                "BUSINESS"

            ];

            const formatted = {};

            orderedPlans.forEach(

                key => {

                    const plan =
                        PLANS[key];

                    if (!plan) {
                        return;
                    }

                    const isUnlimited =

                        plan.limit === null
                        ||
                        plan.limit === Infinity;

                    formatted[
                        plan.key
                    ] = {

                        key:
                            plan.key,

                        name:

                            plan.key === "FREE"
                                ? "Gratuit"
                                : plan.key === "PRO"
                                    ? "PRO"
                                    : "Business",

                        price:
                            Number(plan.price || 0),

                        limit:

                            isUnlimited
                                ? "∞"
                                : Number(plan.limit || 0),

                        isUnlimited,

                        features:

                            Array.isArray(
                                plan.features
                            )

                                ?

                                [...plan.features]

                                :

                                []

                    };

                }

            );

            /* IMPORTANT */
            /* PAS de success/plans */

            return res.json(
                formatted
            );

        }

        catch (error) {

            console.error(

                "PLANS ERROR:",

                error

            );

            return res
                .status(500)
                .json({

                    error:
                        "Plans unavailable"

                });

        }

    }

);

/* ========================= */
/* DEV HEALTH */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.get(

        "/health",

        (req, res) => {

            res.json({

                ok: true,

                service:
                    "plans"

            });

        }

    );

}

export default router;