import db from "../config/database.js";
import OpenAI from "openai";
import { getPlan } from "../config/plans.js";

/* ========================= */
/* OPENAI */
/* ========================= */

if (!process.env.OPENAI_API_KEY) {

    throw new Error(
        "OPENAI_API_KEY manquant"
    );

}

const openai = new OpenAI({

    apiKey:
        process.env.OPENAI_API_KEY,

    timeout: 30000

});

/* ========================= */
/* ASK SEO */
/* ========================= */

export const askSEO =
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

            let {

                question = "",

                keyword = "",

                serp = [],

                products = []

            } = req.body;

            /* ========================= */
            /* VALIDATION */
            /* ========================= */

            question =
                String(question);

            keyword =
                String(keyword);

            if (
                !question.trim()
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Question required"

                    });

            }

            const safeQuestion =
                question
                    .slice(0, 300);

            const safeKeyword =
                keyword
                    .slice(0, 100);

            /* ========================= */
            /* USER */
            /* ========================= */

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

            const plan =
                getPlan(
                    user.plan
                );

            const limit =
                plan.limit;

            const usage =
                await db.get(`

        SELECT
        COUNT(*) as total

        FROM ai_usage

        WHERE user_id=?

        AND strftime(
        '%Y-%m',
        created_at
        )=

        strftime(
        '%Y-%m',
        'now'
        )

    `, [userId]);

            if (

                limit !== null &&

                usage.total >= limit

            ) {

                return res
                    .status(403)
                    .json({

                        error:
                            "LIMIT_REACHED"

                    });

            }

            /* ========================= */
            /* CONTEXT */
            /* ========================= */

            serp =
                Array.isArray(
                    serp
                )
                    ?
                    serp.slice(0, 3)
                    :
                    [];

            products =
                Array.isArray(
                    products
                )
                    ?
                    products.slice(0, 3)
                    :
                    [];

            const topSerp =

                serp

                    .map(

                        s =>

                            `- ${s.title
                                ?.slice(0, 80)
                            || "Sans titre"
                            }`

                    )

                    .join("\n");


            const topProducts =

                products

                    .map(

                        p =>

                            `- ${p.title
                                ?.slice(0, 80)
                            || "Sans titre"
                            }

    (${p.price || ""})`

                    )

                    .join("\n");

            /* ========================= */
            /* PROMPT */
            /* ========================= */

            const systemPrompt = `

Tu es un expert SEO SaaS.

Réponse:

1. Analyse SEO rapide
2. Opportunité
3. Idée business
4. Revenus mensuels
5. Action immédiate

Réponse concise.

`;

            const userPrompt = `

Mot-clé:
${safeKeyword}

Concurrents:
${topSerp || "aucun"}

Produits:
${topProducts || "aucun"}

Question:
${safeQuestion}

`;

            /* ========================= */
            /* OPENAI */
            /* ========================= */

            const response =

                await openai
                    .chat
                    .completions
                    .create({

                        model:
                            "gpt-4o-mini",

                        messages: [

                            {

                                role:
                                    "system",

                                content:
                                    systemPrompt

                            },

                            {

                                role:
                                    "user",

                                content:
                                    userPrompt

                            }

                        ],

                        temperature:
                            0.5,

                        max_tokens:
                            400

                    });

            const answer =

                response
                    ?.choices?.[0]
                    ?.message
                    ?.content

                ||

                "Pas de réponse";


            /* ========================= */
            /* TRACK */
            /* ========================= */

            await db.run(

                `

INSERT INTO
ai_usage(

user_id,

message

)

VALUES(

?,

?

)

`,

                [

                    userId,

                    safeQuestion

                ]

            );

            return res.json({

                answer,

                remaining:

                    limit === null

                        ?

                        "infinite"

                        :

                        Math.max(

                            0,

                            limit -

                            usage.total -

                            1

                        )

            });

        }

        catch (error) {

            console.error(

                "CHAT ERROR:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Chat error"

                });

        }

    };