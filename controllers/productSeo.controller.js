import { estimateSEO }
    from "../utils/seoEstimator.js";

/* ========================= */
/* DEFAULT KEYWORDS */
/* ========================= */

const DEFAULT_KEYWORDS = [

    "tapis yoga liège",

    "sac de frappe boxe",

    "haltères réglables",

    "corde à sauter crossfit",

    "gants musculation"

];

const MAX_KEYWORDS = 20;
const MAX_LENGTH = 100;

/* ========================= */
/* PRODUCTS SEO */
/* ========================= */

export const getProductsSeo =
    async (req, res) => {

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
            /* INPUT */
            /* ========================= */

            let {
                keywords = []
            } = req.body;

            const list =

                Array.isArray(
                    keywords
                )

                    &&

                    keywords.length > 0

                    ?

                    keywords

                        .slice(
                            0,
                            MAX_KEYWORDS
                        )

                        .map(

                            k =>

                                String(k)

                                    .trim()

                                    .slice(
                                        0,
                                        MAX_LENGTH
                                    )

                        )

                        .filter(Boolean)

                    :

                    DEFAULT_KEYWORDS;

            /* ========================= */
            /* SEO */
            /* ========================= */

            const products =

                list.map(

                    (
                        keyword,
                        index
                    ) => {

                        const seo =

                            estimateSEO(
                                keyword
                            );

                        if (
                            !seo
                        ) {

                            return {

                                id:
                                    index + 1,

                                keyword,

                                volume: 0,

                                cpc: 0,

                                revenue: 0,

                                difficulty: 100,

                                score: 0,

                                opportunity: 0,

                                label:
                                    "❌ Weak"

                            };

                        }

                        const volume =

                            Number(
                                seo.volume
                            ) || 0;

                        const cpc =

                            Number(
                                seo.cpc
                            ) || 0;

                        const difficulty =

                            Number(
                                seo.difficulty
                            ) || 100;

                        const revenue =

                            Number(
                                seo.revenue
                            ) || 0;

                        const score =

                            Number(
                                seo.score
                            ) || 0;

                        const opportunity =

                            (
                                volume *
                                cpc
                            )

                            /

                            (
                                difficulty + 1
                            );

                        return {

                            id:
                                index + 1,

                            keyword,

                            volume,

                            cpc,

                            revenue,

                            difficulty,

                            score,

                            opportunity:
                                Math.round(
                                    opportunity
                                ),

                            label:

                                opportunity > 500

                                    ?

                                    "🔥 Strong"

                                    :

                                    opportunity > 200

                                        ?

                                        "⚖️ Medium"

                                        :

                                        "❌ Weak"

                        };

                    });

            /* ========================= */
            /* SORT */
            /* ========================= */

            const sorted =

                [...products]

                    .sort(

                        (a, b) =>

                            b.opportunity -

                            a.opportunity

                    );

            /* ========================= */
            /* RESPONSE */
            /* ========================= */

            return res.json({

                total:
                    sorted.length,

                products:
                    sorted,

                source:
                    "simulated"

            });

        }

        catch (error) {

            console.error(

                "PRODUCT SEO ERROR:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Server error"

                });

        }

    };