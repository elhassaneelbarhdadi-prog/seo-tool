import { fetchRealSEO } from "../services/seoReal.service.js";
import { estimateSEO } from "../utils/seoEstimator.js";

/* ========================= */
/* LIMITS */
/* ========================= */

const MAX_KEYWORD_LENGTH = 100;

/* ========================= */
/* HASH */
/* ========================= */

function hashKeyword(keyword) {

    let hash = 0;

    for (
        let i = 0;
        i < keyword.length;
        i++
    ) {

        hash =

            keyword.charCodeAt(i)

            +

            ((hash << 5) - hash);

    }

    return Math.abs(hash);

}

function seededRandom(seed) {

    const x =
        Math.sin(
            seed % 10000
        )
        * 10000;

    return x -
        Math.floor(x);

}

const cleanText =
    (str = "") =>

        String(str)

            .replace(
                /</g,
                ""
            )

            .replace(
                />/g,
                ""
            )

            .slice(
                0,
                120
            );

/* ========================= */
/* ANALYZE */
/* ========================= */

export async function analyzeKeyword(
    input
) {

    const keyword =

        typeof input === "string"

            ?

            input

            :

            String(
                input?.keyword
                ||
                ""
            );

    const cleanKeyword =

        keyword

            .trim()

            .slice(
                0,
                MAX_KEYWORD_LENGTH
            );

    if (
        !cleanKeyword
    ) {

        throw new Error(
            "Keyword empty"
        );

    }

    const seed =
        hashKeyword(
            cleanKeyword
        );

    /* ========================= */
    /* REAL */
    /* ========================= */

    let real = {};

    try {

        real =

            await fetchRealSEO(
                cleanKeyword
            );

    }

    catch (err) {

        console.error(

            "REAL SEO:",

            err.message

        );

        real = {};

    }

    /* ========================= */
    /* FALLBACK */
    /* ========================= */

    const base =

        estimateSEO(
            cleanKeyword
        )

        ||

        {};

    const volume =

        Number(
            real?.volume
        )

        ||

        Number(
            base.volume
        )

        ||

        1000;

    const cpc =

        Number(
            real?.cpc
        )

        ||

        Number(
            base.cpc
        )

        ||

        0.2;

    const difficulty =

        Number(
            real?.difficulty
        )

        ||

        Number(
            base.difficulty
        )

        ||

        50;

    /* ========================= */
    /* SCORE */
    /* ========================= */

    const score =

        Math.max(

            0,

            Math.min(

                100,

                Math.round(

                    (

                        Math.log10(
                            volume + 1
                        )

                        * 20

                        * 0.4

                    )

                    +

                    (

                        cpc
                        * 20
                        * 0.3

                    )

                    +

                    (

                        (100 - difficulty)

                        * 0.3

                    )

                )

            )

        );

    /* ========================= */
    /* BUSINESS */
    /* ========================= */

    const trafficPosition1 =

        Math.floor(
            volume * 0.3
        );

    const revenue =

        Math.floor(
            volume *
            cpc *
            0.3
        );

    const roiScore =

        Math.floor(
            trafficPosition1 *
            cpc
        );

    /* ========================= */
    /* TREND */
    /* ========================= */

    const trend =

        Array.isArray(
            real?.trend
        )

            &&

            real.trend.length

            ?

            real.trend

            :

            Array.from(

                {
                    length: 12
                },

                (_, i) =>

                    Math.max(

                        0,

                        Math.round(

                            volume *

                            (

                                0.8 +

                                Math.sin(
                                    i / 2 +
                                    seed
                                )

                                * 0.2 +

                                seededRandom(
                                    seed + i
                                )

                                * 0.1

                            )

                        )

                    )

            );

    /* ========================= */
    /* SERP */
    /* ========================= */

    const serp =

        Array.isArray(
            real?.serp
        )

            &&

            real.serp.length

            ?

            real.serp
                .slice(0, 10)

            :

            [

                {

                    title:
                        `${cleanKeyword} guide`,

                    link:
                        "/",

                    snippet:
                        "Guide"

                },

                {

                    title:
                        `${cleanKeyword} avis`,

                    link:
                        "/",

                    snippet:
                        "Avis"

                }

            ];

    /* ========================= */
    /* IDEAS */
    /* ========================= */

    const ideas = [

        `Guide complet sur ${cleanText(cleanKeyword)}`,

        `Comparatif des solutions`,

        `Avis utilisateurs`,

        `Tutoriel étape par étape`,

        `FAQ ${cleanText(cleanKeyword)}`

    ];

    /* ========================= */
    /* INTENTS */
    /* ========================= */

    let commercial =

        40 +
        Math.round(
            seededRandom(seed) * 30
        );

    let informational =

        20 +
        Math.round(
            seededRandom(seed + 1)
            * 20
        );

    let transactional =

        10 +
        Math.round(
            seededRandom(seed + 2)
            * 20
        );

    let navigational =

        5 +
        Math.round(
            seededRandom(seed + 3)
            * 10
        );

    const total =

        commercial +
        informational +
        transactional +
        navigational;

    const intents = {

        commercial:
            Math.round(
                commercial /
                total
                * 100
            ),

        informational:
            Math.round(
                informational /
                total
                * 100
            ),

        transactional:
            Math.round(
                transactional /
                total
                * 100
            ),

        navigational:
            Math.round(
                navigational /
                total
                * 100
            )

    };

    /* ========================= */
    /* DECISION */
    /* ========================= */

    const decision =

        score >= 70

            ? "HIGH"

            :

            score >= 40

                ? "MEDIUM"

                :

                "LOW";

    /* ========================= */
    /* RETURN */
    /* ========================= */

    return {

        keyword:
            cleanKeyword,

        volume,

        cpc,

        difficulty,

        score,

        revenue,

        trafficPosition1,

        roiScore,

        decision,

        competition:
            difficulty,

        trend,

        serp,

        suggestions:
            ideas,

        ideas,

        intents,

        action: "",

        reasons: []

    };

}