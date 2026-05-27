import db from "../config/database.js";
import { cleanKeyword } from "../utils/cleanKeyword.js";
import { fetchRealSEO } from "../services/seoReal.service.js";
import { generateLandingContent } from "../utils/seoContent.js";

/* ========================= */
/* HELPERS */
/* ========================= */

const MAX_SLUG = 120;

const escapeHtml = (str = "") => {

    return String(str)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

};

const capitalize = (s) =>

    s

        ?

        s.charAt(0)
            .toUpperCase()

        +

        s.slice(1)

        :

        "";

/* ========================= */
/* SEO PAGE */
/* ========================= */

export const getSeoPage =
    async (req, res) => {

        try {

            let {
                slug = ""
            } = req.query;

            /* ========================= */
            /* VALIDATION */
            /* ========================= */

            slug =

                String(slug)

                    .trim()

                    .toLowerCase()

                    .slice(
                        0,
                        MAX_SLUG
                    );

            if (
                !slug
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Missing slug"

                    });

            }

            /* ========================= */
            /* NORMALIZE */
            /* ========================= */

            const safeSlug =

                slug

                    .normalize("NFD")

                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    )

                    .replace(
                        /\s+/g,
                        "-"
                    )

                    .replace(
                        /[^a-z0-9-]/g,
                        ""
                    );

            /* ========================= */
            /* USER CITY */
            /* ========================= */

            const userCity =
                req.userCity
                ||
                null;

            /* ========================= */
            /* CACHE */
            /* ========================= */

            const page =

                await db.get(

                    `

SELECT *

FROM seo_pages

WHERE slug=?

LIMIT 1

`,

                    [safeSlug]

                );

            if (page) {

                return res.json(
                    page
                );

            }

            /* ========================= */
            /* PARSE */
            /* ========================= */

            const parts =

                safeSlug
                    .split("-")
                    .filter(Boolean);

            let city = null;
            let keyword = null;

            const knownCities = [

                "paris",

                "lyon",

                "marseille",

                "toulouse",

                "nice",

                "nantes",

                "lille",

                "bordeaux",

                "strasbourg",

                "montpellier",

                "saint-etienne"

            ];

            const last =
                parts[
                parts.length - 1
                ];

            const lastTwo =
                parts
                    .slice(-2)
                    .join("-");

            if (
                knownCities.includes(
                    lastTwo
                )
            ) {

                city =
                    lastTwo;

                keyword =

                    cleanKeyword(

                        parts
                            .slice(0, -2)
                            .join(" ")

                    );

            }

            else if (

                knownCities.includes(
                    last
                )

            ) {

                city =
                    last;

                keyword =

                    cleanKeyword(

                        parts
                            .slice(0, -1)
                            .join(" ")

                    );

            }

            else {

                keyword =
                    cleanKeyword(
                        parts.join(" ")
                    );

                city =
                    userCity
                    ||
                    "france";

            }

            if (
                !keyword
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Invalid keyword"

                    });

            }

            /* ========================= */
            /* SEO */
            /* ========================= */

            let seo = {};

            try {

                seo =

                    await fetchRealSEO(
                        keyword
                    );

            }

            catch (err) {

                console.error(

                    "SEO API:",

                    err.message

                );

                seo = {};

            }

            const volume =

                Number(
                    seo?.volume
                ) || 0;

            const cpc =

                Number(
                    seo?.cpc
                ) || 0;

            const difficulty =

                Number(
                    seo?.difficulty
                ) || 0;

            const score =

                Number(
                    seo?.score
                ) || 0;

            const revenue =

                Number(
                    seo?.revenue
                )

                ||

                Math.floor(
                    volume * 0.25
                );

            const competition =

                Number(

                    seo?.competition
                    ??

                    seo?.difficulty

                ) || 0;

            /* ========================= */
            /* CONTENT */
            /* ========================= */

            const keywordLabel =

                capitalize(
                    keyword
                );

            const cityLabel =

                capitalize(
                    city
                );

            const landing =

                generateLandingContent(

                    keyword,

                    city

                )

                ||

                {

                    description: "",
                    faq: []

                };

            const faq =

                Array.isArray(
                    landing.faq
                )

                    ?

                    landing.faq

                    : [];


            const content = `

<h2>

${escapeHtml(
                keywordLabel
            )}

à

${escapeHtml(
                cityLabel
            )}

</h2>

<p>

${escapeHtml(
                landing.description
            )}

</p>

<h3>

Questions fréquentes

</h3>

${faq.map(

                f => `

<p>

<strong>

${escapeHtml(
                    f.q
                )}

</strong>

<br/>

${escapeHtml(
                    f.a
                )}

</p>

`

            ).join("")}

`;

            /* ========================= */
            /* SAVE */
            /* ========================= */

            try {

                await db.run(

                    `

INSERT INTO seo_pages(

keyword,

city,

slug,

content,

score,

volume,

difficulty,

revenue,

cpc

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

?

)

`,

                    [

                        keyword,

                        city,

                        safeSlug,

                        content,

                        score,

                        volume,

                        difficulty,

                        revenue,

                        cpc

                    ]

                );

            }

            catch (err) {

                console.warn(

                    "SAVE:",

                    err.message

                );

            }

            /* ========================= */
            /* RESPONSE */
            /* ========================= */

            return res.json({

                slug:
                    safeSlug,

                keyword,

                city,

                volume,

                cpc,

                revenue,

                competition,

                score,

                content

            });

        }

        catch (err) {

            console.error(

                "SEO PAGE:",

                err.message

            );

            return res
                .status(500)
                .json({

                    slug:
                        req.query.slug || "",

                    error:
                        "SEO generation failed",

                    content:
                        "Contenu SEO temporairement indisponible"

                });

        }

    };