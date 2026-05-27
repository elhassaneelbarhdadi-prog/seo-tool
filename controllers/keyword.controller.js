
import db from "../config/database.js";
import { generateKeywordIdeas } from "../services/ai.service.js";
import { PLANS } from "../config/plans.js";
import { fetchRealSEO } from "../services/seoReal.service.js";
import { fetchSerpData } from "../services/serper.js";

/* ========================= */
/* HELPER USAGE */
/* ========================= */

const incrementUsage = async (
    userId,
    keyword = "ai"
) => {

    try {

        if (!userId) return;

        console.log("🔥 INCREMENT:", {
            userId,
            keyword
        });

        await db.run(
            `
            INSERT INTO ai_usage(
                user_id,
                message,
                created_at
            )
            VALUES(
                ?,
                ?,
                datetime('now')
            )
            `,
            [
                Number(userId),
                String(keyword)
            ]
        );

        console.log("✅ USAGE INSERTED");

    }

    catch (err) {

        console.error(
            "❌ INCREMENT ERROR:",
            err
        );

    }

};
/* ========================= */
/* USAGE */
/* ========================= */





export const getUsage = async (req, res) => {

    try {

        const userId = req.user.id;

        /* USER */

        const user = await db.get(
            `
            SELECT
                plan,
                subscription_status
            FROM users
            WHERE id=?
            `,
            [userId]
        );

        const planKey =
            String(user?.plan || "FREE")
                .toUpperCase();

        const plan =
            PLANS[planKey] || PLANS.FREE;

        /* ========================= */
        /* COUNT REAL USAGE */
        /* ========================= */

        const result = await db.get(
            `
            SELECT COUNT(*) as total
            FROM ai_usage
            WHERE user_id=?
            AND strftime('%Y-%m', created_at)
            =
            strftime('%Y-%m', 'now')
            `,
            [userId]
        );

        const used =
            Number(result?.total || 0);

        const limit =
            plan.limit === null
                ? null
                : Number(plan.limit);

        console.log("🔥 USAGE:", {
            used,
            limit,
            plan: plan.key
        });

        return res.json({

            used,

            limit,

            plan: plan.key,

            remaining:
                limit === null
                    ? null
                    : Math.max(limit - used, 0)

        });

    }

    catch (error) {

        console.error(
            "USAGE ERROR:",
            error
        );

        return res.status(500).json({

            error: "usage error"

        });

    }

};
/* ========================= */
/* HISTORY */
/* ========================= */

export const getKeywordHistory =
    async (req, res) => {

        try {

            const rows =

                await db.all(

                    `

SELECT *

FROM keywords

WHERE user_id=?
AND (
    deleted=0
    OR deleted IS NULL
)

ORDER BY
created_at DESC

`,

                    [req.user.id]

                );

            return res
                .json(rows);

        }

        catch (err) {

            console.error(

                "HISTORY ERROR:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Failed history"

                });

        }

    };

/* ========================= */
/* DELETE ALL */
/* ========================= */

export const deleteAllKeywords =
    async (req, res) => {

        try {

            const userId =
                req.user?.id;

            if (
                !userId
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Unauthorized"

                    });

            }

            await db.run(

                `

UPDATE keywords

SET deleted=1

WHERE user_id=?

`,

                [userId]

            );

            return res.json({

                success: true

            });

        }

        catch (err) {

            console.error(

                "DELETE ALL:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Delete failed"

                });

        }

    };

/* ========================= */
/* DELETE ONE */
/* ========================= */

export const deleteKeyword = async (req, res) => {

    try {

        /* ========================= */
        /* VALIDATION ID */
        /* ========================= */

        const id =
            Number(req.params.id);

        if (
            !Number.isInteger(id)
            || id <= 0
        ) {

            return res.status(400).json({
                error: "Invalid keyword id"
            });

        }

        /* ========================= */
        /* DELETE SOFT */
        /* ========================= */

        await db.run(
            `
            UPDATE keywords
            SET deleted=1
            WHERE id=?
            AND user_id=?
            `,
            [
                id,
                req.user.id
            ]
        );

        return res.json({

            success: true

        });

    }

    catch (error) {

        console.error(
            "DELETE KEYWORD ERROR:",
            error
        );

        return res.status(500).json({

            error:
                "Delete failed"

        });

    }

};
/* ========================= */
/* AI */
/* ========================= */

export const generateAIKeywords =
    async (req, res) => {

        try {

            const keyword =

                String(
                    req.body.keyword
                    ||
                    ""
                )

                    .trim()

                    .slice(0, 100);

            const userId =
                req.user?.id;

            if (
                !keyword
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Keyword required"

                    });

            }

            const ideas =

                await generateKeywordIdeas(
                    keyword
                );

            await incrementUsage(
                userId,
                keyword
            );

            return res.json({

                keyword,

                ideas

            });

        }

        catch (err) {

            console.error(

                "AI ERROR:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "AI error"

                });

        }

    };

/* ========================= */
/* ANALYZE */
/* ========================= */

export const analyzeKeyword =
    async (req, res) => {

        try {

            const keyword =

                String(
                    req.body.keyword
                    ||
                    ""
                )

                    .trim()

                    .toLowerCase()

                    .slice(0, 100);

            const userId =
                req.user?.id;

            if (
                !keyword
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Keyword required"

                    });

            }

            if (
                !userId
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Unauthorized"

                    });

            }

            if (
                process.env.NODE_ENV
                === "development"
            ) {

                console.log(
                    "ANALYZE:",
                    keyword
                );

            }

            const user =

                await db.get(

                    `

SELECT
plan

FROM users

WHERE id=?

`,

                    [userId]

                );

            const limit =

                PLANS[
                    user?.plan
                    ||
                    "FREE"
                ]
                    ?.limit
                ??
                null;

            const usage =

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

                    [userId]

                );

            if (

                limit !== null

                &&

                usage.total >= limit

            ) {

                return res
                    .status(403)
                    .json({

                        error:
                            "Limit reached"

                    });

            }

            const existing =

                await db.get(

                    `

SELECT id

FROM keywords

WHERE

keyword=?

AND user_id=?

AND (
 deleted=0
 OR deleted IS NULL
)

`,

                    [

                        keyword,

                        userId

                    ]

                );

            const real =
                await fetchRealSEO(
                    keyword
                );

            const serpData =
                await fetchSerpData(
                    keyword
                );

            const volume =
                Number(
                    real?.volume
                )
                || 0;

            const difficulty =
                Number(
                    real?.difficulty
                )
                || 0;

            const cpc =
                Number(
                    real?.cpc
                )
                || 0;

            const estimatedTrafficPosition1 =

                Number(
                    real?.trafficPosition1
                )

                ||

                Math.floor(
                    volume * 0.28
                );

            const estimatedROI =

                Number(
                    real?.roiScore
                )

                ||

                Math.floor(

                    estimatedTrafficPosition1

                    *

                    0.02

                    *

                    Math.max(
                        cpc * 100,
                        20
                    )

                );

            const volumeScore =

                Math.min(
                    40,
                    Math.log10(
                        volume + 1
                    ) * 10
                );

            const cpcScore =

                Math.min(
                    30,
                    cpc * 10
                );

            const difficultyScore =

                Math.max(
                    0,
                    (100 - difficulty)
                    * 0.3
                );

            const score =

                Math.round(

                    volumeScore +

                    cpcScore +

                    difficultyScore

                );

            const competition =

                difficulty >= 80
                    ? "hard"
                    :
                    difficulty >= 50
                        ? "medium"
                        :
                        "easy";

            const verdict =

                score >= 70
                    ? "GO"
                    :
                    score >= 40
                        ? "WAIT"
                        :
                        "NO_GO";

            const trend =

                Array.isArray(
                    real?.trend
                )
                    ?
                    real.trend
                    :
                    [];

            if (existing) {

                await db.run(

                    `

UPDATE keywords

SET

volume=?,

difficulty=?,

cpc=?,

score=?,

revenue=?,

trend=?,

created_at=datetime('now')

WHERE id=?

`,

                    [

                        volume,

                        difficulty,

                        cpc,

                        score,

                        estimatedROI,

                        JSON.stringify(
                            trend
                        ),

                        existing.id

                    ]

                );

            } else {

                await db.run(

                    `

INSERT INTO keywords(

keyword,

volume,

difficulty,

cpc,

score,

revenue,

trend,

user_id

)

VALUES(

?,

?,

?,

?,

?,

?,

?,

?

)

`,

                    [

                        keyword,

                        volume,

                        difficulty,

                        cpc,

                        score,

                        estimatedROI,

                        JSON.stringify(
                            trend
                        ),

                        userId

                    ]

                );

            }

            await incrementUsage(
                userId,
                keyword
            );

            return res.json({

                keyword,

                volume,

                difficulty,

                cpc,

                score,

                competition,

                verdict,

                revenue:
                    estimatedROI,

                roiScore:
                    estimatedROI,

                estimatedTrafficPosition1,

                intents:
                    real?.intents
                    ||
                    {},

                trend,

                serp:

                    Array.isArray(
                        serpData?.organic
                    )

                        ?

                        serpData
                            .organic
                            .map(

                                item => ({

                                    title:
                                        item.title,

                                    link:
                                        item.link,

                                    snippet:
                                        item.snippet,

                                    position:
                                        item.position

                                })

                            )

                        : [],

                suggestions:

                    Array.isArray(
                        serpData
                            ?.relatedSearches
                    )

                        ?

                        serpData
                            .relatedSearches
                            .map(
                                s => s.query
                            )

                        : [],

                questions:

                    Array.isArray(
                        serpData
                            ?.peopleAlsoAsk
                    )

                        ?

                        serpData
                            .peopleAlsoAsk
                            .map(
                                q => q.question
                            )

                        : [],

                ideas:
                    real?.ideas
                    ||
                    []

            });

        }

        catch (error) {

            console.error(

                "ANALYZE ERROR:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Analyze error"

                });

        }

    };

/* ========================= */
/* SUGGESTIONS */
/* ========================= */

export const getKeywordSuggestions =
    async (req, res) => {

        try {

            const keyword =

                String(
                    req.body.keyword
                    ||
                    ""
                )

                    .trim()

                    .slice(0, 100);

            if (
                !keyword
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Keyword required"

                    });

            }

            const serpData =

                await fetchSerpData(
                    keyword
                );

            const suggestions =

                Array.isArray(
                    serpData
                        ?.relatedSearches
                )

                    ?

                    serpData
                        .relatedSearches
                        .map(
                            s => s.query
                        )

                    : [];

            return res.json({

                keyword,

                suggestions

            });

        }

        catch (err) {

            console.error(

                "SUGGESTION ERROR:",

                err.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Suggestion error"

                });

        }

    };