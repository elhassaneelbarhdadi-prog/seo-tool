import db from "../config/database.js";
import { analyzeKeyword } from "../core/seoEngine.js";

/* ========================= */
/* LIMITS */
/* ========================= */

const MAX_KEYWORD_LENGTH = 100;

/* ========================= */
/* ANALYZE SEO */
/* ========================= */
export const analyzeSEO = async (req, res) => {



    try {
        console.log("SEO analyze:", {
            userId: req.user?.id,
            keyword: req.body?.keyword
        });      /* ========================= */
        /* AUTH */
        /* ========================= */


        /* ========================= */
        /* INPUT */
        /* ========================= */

        let keyword =

            String(
                req.body.keyword
                || ""
            )

                .trim()

                .slice(
                    0,
                    MAX_KEYWORD_LENGTH
                );

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
            keyword.length < 2
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Keyword too short"

                });

        }

        const city =

            req.user?.city
            ||
            null;

        const finalKeyword =

            city

                ?

                `${keyword} à ${city}`

                :

                keyword;

        /* ========================= */
        /* ENGINE */
        /* ========================= */

        let data = {};

        try {

            data =

                await analyzeKeyword(
                    finalKeyword
                );

        }

        catch (err) {

            console.error(

                "ENGINE ERROR:",

                err.message

            );

            data = {};

        }

        /* ========================= */
        /* SAFE */
        /* ========================= */

        const volume =

            Number(
                data?.volume
            ) || 0;

        const cpc =

            Number(
                data?.cpc
            ) || 0.2;

        const difficulty =

            Number(
                data?.difficulty
            ) || 50;

        const trend =

            Array.isArray(
                data?.trend
            )

                ?

                data.trend

                :

                [];

        const serp =

            Array.isArray(
                data?.serp
            )

                ?

                data.serp
                    .slice(0, 10)

                :

                [];

        /* ========================= */
        /* INTENTS */
        /* ========================= */

        const intents =

            data?.intents

            ||

            {

                commercial: 40,

                informational: 30,

                transactional: 20,

                navigational: 10

            };

        const dominantIntent =

            Object.entries(
                intents
            )

                .sort(
                    (a, b) =>
                        b[1] - a[1]
                )

            [0]?.[0]

            ||

            "commercial";

        /* ========================= */
        /* ROI */
        /* ========================= */

        const ctr = 0.28;

        const traffic =
            Math.floor(
                volume * ctr
            );

        const conversionRate =

            dominantIntent === "transactional"

                ? 0.04

                :

                dominantIntent === "commercial"

                    ? 0.025

                    :

                    0.01;

        const avgOrderValue =

            cpc > 3

                ? 150

                :

                cpc > 1.5

                    ? 80

                    :

                    40;

        const monthlyRevenue =

            traffic *
            conversionRate *
            avgOrderValue;

        const seoCost =

            difficulty < 30

                ? 500

                :

                difficulty < 60

                    ? 1500

                    :

                    3000;

        const roiScore =

            Math.max(

                0,

                Math.floor(

                    monthlyRevenue -
                    seoCost

                )

            );

        const roiRatio =

            seoCost > 0

                ?

                Number(

                    (

                        monthlyRevenue /
                        seoCost

                    )

                        .toFixed(2)

                )

                :

                0;

        let roiLabel = "Faible";

        if (roiRatio > 3)
            roiLabel = "🔥 Opportunité énorme";

        else if (roiRatio > 2)
            roiLabel = "🚀 Très rentable";

        else if (roiRatio > 1.2)
            roiLabel = "👍 Rentable";

        else if (roiRatio > 0.8)
            roiLabel = "⚖️ Limite";

        else
            roiLabel = "❌ Mauvais";

        /* ========================= */
        /* SCORE */
        /* ========================= */

        const demandScore =

            volume > 50000 ? 100 :

                volume > 10000 ? 80 :

                    volume > 2000 ? 60 :

                        volume > 500 ? 40 : 20;

        const competitionScore =

            difficulty < 20 ? 100 :

                difficulty < 40 ? 80 :

                    difficulty < 60 ? 60 :

                        difficulty < 80 ? 40 : 20;

        const valueScore =

            cpc > 3 ? 100 :

                cpc > 2 ? 80 :

                    cpc > 1 ? 60 :

                        cpc > 0.5 ? 40 : 20;

        const intentScore =

            dominantIntent === "transactional"

                ? 100

                :

                dominantIntent === "commercial"

                    ? 80

                    :

                    dominantIntent === "informational"

                        ? 50

                        :

                        30;

        const finalScore =

            Math.round(

                demandScore * 0.35 +

                competitionScore * 0.25 +

                valueScore * 0.25 +

                intentScore * 0.15

            );

        /* ========================= */
        /* VERDICT */
        /* ========================= */

        let verdict = "NO_GO";

        if (
            roiScore > 2000 &&
            difficulty < 70
        ) {

            verdict = "GO";

        }

        else if (
            roiScore > 500
        ) {

            verdict = "WAIT";

        }

        /* ========================= */
        /* FINAL */
        /* ========================= */

        const finalData = {

            keyword:
                finalKeyword,

            city,

            volume,

            cpc,

            difficulty,

            competition:
                difficulty,

            score:
                finalScore,

            scoreFinal:
                finalScore,

            verdict,

            revenue:
                Math.floor(
                    monthlyRevenue
                ),

            roiScore,

            roiRatio,

            roiLabel,

            trafficPosition1:
                traffic,

            quickWinScore:

                Math.max(

                    0,

                    Math.round(

                        (100 - difficulty)
                        * 0.6 +

                        Math.min(
                            volume / 100,
                            40
                        )

                    )

                ),

            timeToRank:

                difficulty < 30
                    ? "1-2 mois"

                    :

                    difficulty < 50
                        ? "2-4 mois"

                        :

                        difficulty < 70
                            ? "4-8 mois"

                            :

                            "8-12 mois",

            kgr:

                volume > 0

                    ?

                    Number(

                        (

                            serp.length /
                            volume

                        )

                            .toFixed(2)

                    )

                    :

                    0,

            intents,

            intent:
                dominantIntent,

            trend,

            serp,

            ideas:
                data?.ideas || [],

            suggestions:
                data?.suggestions || []

        };

        /* ========================= */
        /* SAVE */
        /* ========================= */

        if (req.user?.id) {

            try {

                console.log("🔥 SAVE START");
                console.log("🔥 USER ID:", req.user.id);

                const result = await db.run(

                    `
            INSERT INTO keywords(

                keyword,
                volume,
                difficulty,
                cpc,
                intent,
                score,
                revenue,
                potential,
                decision,
                user_id,
                created_at

            )

            VALUES(

                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                datetime('now')

            )
            `,

                    [

                        finalData.keyword,
                        finalData.volume,
                        finalData.difficulty,
                        finalData.cpc,
                        finalData.intent,
                        finalData.score,
                        finalData.revenue,

                        finalScore >= 70
                            ? "high"
                            : "medium",

                        finalData.verdict,

                        req.user.id

                    ]

                );

                console.log("🔥 SAVE OK:", result);

            }

            catch (err) {

                console.error(
                    "🔥 SAVE ERROR:",
                    err
                );

            }

        }
        /* ========================= */
        /* RESPONSE */
        /* ========================= */

        return res.json(
            finalData
        );

    }

    catch (error) {

        console.error(

            "CONTROLLER:",

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