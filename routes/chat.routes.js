import express from "express";
import OpenAI from "openai";
import db from "../config/database.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getPlan } from "../config/plans.js";

const router = express.Router();

/* ========================= */
/* OPENAI */
/* ========================= */

if (!process.env.OPENAI_API_KEY) {
    throw new Error(
        "OPENAI_API_KEY manquant"
    );
}

const openai =
    new OpenAI({

        apiKey:
            process.env.OPENAI_API_KEY

    });

const MAX_PROMPT = 500;
const MAX_KEYWORD = 100;

/* ========================= */
/* SEO CHAT */
/* ========================= */

router.post(
    "/seo",
    authMiddleware,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const prompt =

                String(
                    req.body.prompt
                    ||
                    ""
                )

                    .trim()

                    .slice(
                        0,
                        MAX_PROMPT
                    );

            const keyword =

                String(
                    req.body.keyword
                    ||
                    ""
                )

                    .trim()

                    .slice(
                        0,
                        MAX_KEYWORD
                    );

            const serp =

                Array.isArray(
                    req.body.serp
                )

                    ?

                    req.body.serp
                        .slice(0, 3)

                    :

                    [];

            if (
                !prompt
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Prompt required"

                    });

            }

            /* ========================= */
            /* PLAN */
            /* ========================= */

            const user =

                await db.get(

                    `

SELECT
plan

FROM users

WHERE id=?

LIMIT 1

`,

                    [userId]

                );

            const planData =

                getPlan(
                    user?.plan
                );

            const limit =
                planData.limit;

            const usage =

                await db.get(

                    `

SELECT

COUNT(*) total

FROM ai_usage

WHERE user_id=?

AND

strftime(
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
                            "LIMIT_REACHED",

                        used:
                            usage.total,

                        limit

                    });

            }

            /* ========================= */
            /* CONTEXT */
            /* ========================= */

            const topSerp =

                serp

                    .map(

                        s =>

                            `- ${String(
                                s?.title
                                ||
                                ""
                            )

                                .slice(
                                    0,
                                    80
                                )

                            }`

                    )

                    .join("\n");

            /* ========================= */
            /* PROMPTS */
            /* ========================= */

            const systemPrompt = `

Tu es un expert SEO senior.

Réponds :

1. Analyse rapide

2. Opportunité business

3. Niveau concurrence

4. Action recommandée

Réponse concise.
`;

            const userPrompt = `

Mot-clé:
${keyword || "N/A"}

SERP:

${topSerp || "aucun"}

Question:

${prompt}

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
                            0.6,

                        max_tokens:
                            500

                    });

            const result =

                response
                    .choices?.[0]
                    ?.message
                    ?.content

                ||

                "Aucune réponse";

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

                    prompt

                ]

            );

            return res.json({

                result

            });

        }

        catch (error) {

            console.error(

                "AI:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "AI error"

                });

        }

    });

export default router;