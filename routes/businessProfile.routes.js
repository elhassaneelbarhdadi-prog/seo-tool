import express from "express";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { fetchRealSEO }
    from "../services/seoReal.service.js";
const router = express.Router();

const MAX_LENGTH = 150;

/* ========================= */
/* HELPERS */
/* ========================= */

const clean = (v = "") =>

    String(v)
        .trim()
        .slice(0, MAX_LENGTH);

const hash = (str) => {

    let h = 0;

    for (let i = 0; i < str.length; i++) {

        h =
            str.charCodeAt(i)
            +
            ((h << 5) - h);

    }

    return Math.abs(h);

};

const seededRandom = (seed) => {

    const x =
        Math.sin(seed % 10000)
        * 10000;

    return x -
        Math.floor(x);

};

const isPremiumUser =
    async (userId) => {

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

                [userId]

            );

        if (!user) {

            return false;

        }

        return (

            ["PRO", "BUSINESS"]
                .includes(user.plan)

            &&

            user.subscription_status
            === "active"

        );

    };

/* ========================= */
/* CREATE */
/* ========================= */

router.post(
    "/",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const name =
                clean(req.body.name);

            const description =
                clean(
                    req.body.description
                );

            const keyword =
                clean(req.body.keyword);

            const city =
                clean(req.body.city);

            if (
                !name ||
                !keyword ||
                !city
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "missingFields"

                    });

            }

            const premium =

                await isPremiumUser(
                    userId
                );

            if (!premium) {

                return res
                    .status(403)
                    .json({

                        error:
                            "upgradeRequired"

                    });

            }

            const existing =

                await db.get(

                    `

SELECT id

FROM business_profiles

WHERE user_id=?

LIMIT 1

`,

                    [userId]

                );

            if (existing) {

                return res.json({

                    alreadyExists: true

                });

            }

            /* deterministic score */

            /* ========================= */
            /* REAL SEO */
            /* ========================= */

            const seo =
                await fetchRealSEO(
                    keyword
                );

            const volume =
                Number(
                    seo?.volume || 0
                );

            const difficulty =
                Number(
                    seo?.difficulty || 50
                );

            const cpc =
                Number(
                    seo?.cpc || 0
                );

            /* ========================= */
            /* SEO SCORE */
            /* ========================= */

            let score = 50;

            /* volume */

            score += Math.min(
                volume / 1000,
                25
            );

            /* CPC */

            score += Math.min(
                cpc * 5,
                20
            );

            /* difficulté */

            score += Math.max(
                0,
                (100 - difficulty) / 5
            );

            /* longue traîne */

            score +=
                keyword.split(" ").length >= 2
                    ? 10
                    : 0;

            score = Math.min(
                100,
                Math.round(score)
            );
            await db.run(

                `

INSERT INTO
business_profiles(

user_id,

name,

description,

keyword,

city,

score

)

VALUES(

?,

?,

?,

?,

?,

?

)

`,

                [

                    userId,

                    name,

                    description,

                    keyword,

                    city,

                    score

                ]

            );

            return res.json({

                success: true,

                score

            });

        }

        catch (err) {

            console.error(

                "PROFILE:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "serverError"

                });

        }

    }
);

/* ========================= */
/* GET */
/* ========================= */
/* ========================= */
/* GET */
/* ========================= */

router.get(
    "/",
    async (req, res) => {

        try {

            const search =

                String(
                    req.query.search || ""
                )
                    .trim();

            let rows = [];

            /* ========================= */
            /* SEARCH MODE */
            /* ========================= */

            if (search) {

                rows = await db.all(

                    `

SELECT

id,

name,

description,

keyword,

city,

score

FROM
business_profiles

WHERE

name LIKE ?

OR keyword LIKE ?

OR city LIKE ?

ORDER BY score DESC

LIMIT 20

`,

                    [

                        `%${search}%`,

                        `%${search}%`,

                        `%${search}%`

                    ]

                );

            }

            /* ========================= */
            /* DEFAULT MODE */
            /* ========================= */

            else {

                rows = await db.all(

                    `

SELECT

id,

name,

description,

keyword,

city,

score

FROM
business_profiles

ORDER BY score DESC

LIMIT 20

`

                );

            }

            /* ========================= */
            /* TOTAL */
            /* ========================= */

            const total =

                await db.get(

                    `

SELECT
COUNT(*) total

FROM
business_profiles

`

                );

            return res.json({

                success: true,

                businesses: rows,

                total:
                    total.total,

                hasMore:

                    total.total >
                    rows.length

            });

        }

        catch (err) {

            console.error(

                "GET PROFILE:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "serverError"

                });

        }

    }
);
/* ========================= */
/* DEV ONLY */
/* ========================= */

if (
    process.env.NODE_ENV
    === "development"
) {

    router.post(

        "/seed",

        authMiddleware,

        async (req, res) => {

            if (
                !req.user?.isAdmin
            ) {

                return res
                    .status(403)
                    .json({

                        error:
                            "Forbidden"

                    });

            }

            try {

                const existing =

                    await db.get(

                        `

SELECT
COUNT(*) total

FROM
business_profiles

`

                    );

                if (
                    existing.total > 0
                ) {

                    return res.json({

                        message:
                            "Already seeded"

                    });

                }

                const fakeData = [

                    {

                        name:
                            "Agence SEO Paris",

                        description:
                            "Experts référencement local",

                        keyword:
                            "SEO Paris",

                        city:
                            "Paris",

                        score: 92

                    },

                    {

                        name:
                            "Coach Sport Lyon",

                        description:
                            "Coaching personnalisé",

                        keyword:
                            "coach sportif Lyon",

                        city:
                            "Lyon",

                        score: 88

                    }

                ];

                for (
                    const p
                    of fakeData
                ) {

                    await db.run(

                        `

INSERT INTO
business_profiles(

user_id,

name,

description,

keyword,

city,

score

)

VALUES(

?,

?,

?,

?,

?,

?

)

`,

                        [

                            req.user.id,

                            p.name,

                            p.description,

                            p.keyword,

                            p.city,

                            p.score

                        ]

                    );

                }

                return res.json({

                    success: true

                });

            }

            catch (err) {

                console.error(

                    "SEED:",

                    err.message

                );

                return res
                    .status(500)
                    .json({

                        error:
                            "serverError"

                    });

            }

        }

    );

}

export default router;