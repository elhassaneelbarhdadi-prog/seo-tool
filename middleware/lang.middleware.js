/* ========================= */
/* LANGS */
/* ========================= */

const SUPPORTED_LANGS =

    Object.freeze([

        "fr",

        "en",

        "es",

        "de"

    ]);

const DEFAULT_LANG = "fr";

/* ========================= */
/* MIDDLEWARE */
/* ========================= */

export const langMiddleware =
    (req, res, next) => {

        try {

            /* ========================= */
            /* HEADER */
            /* ========================= */

            const headerLang =

                String(

                    req.headers[
                    "x-lang"
                    ]

                    ||

                    ""

                )

                    .trim()

                    .toLowerCase()

                    .slice(0, 5);

            /* ========================= */
            /* BROWSER */
            /* ========================= */

            const acceptLanguage =

                String(

                    req.headers[
                    "accept-language"
                    ]

                    ||

                    ""

                );

            let browserLang = null;

            if (
                acceptLanguage
            ) {

                browserLang =

                    acceptLanguage

                        .split(",")

                    [0]

                        ?.split("-")

                    [0]

                        ?.trim()

                        ?.toLowerCase();

            }

            /* ========================= */
            /* SELECT */
            /* ========================= */

            let lang =
                DEFAULT_LANG;

            if (

                SUPPORTED_LANGS
                    .includes(
                        headerLang
                    )

            ) {

                lang =
                    headerLang;

            }

            else if (

                browserLang &&

                SUPPORTED_LANGS
                    .includes(
                        browserLang
                    )

            ) {

                lang =
                    browserLang;

            }

            /* ========================= */
            /* ATTACH */
            /* ========================= */

            req.lang =
                lang;

            req.isDefaultLang =

                lang ===
                DEFAULT_LANG;

            next();

        }

        catch (error) {

            console.error(

                "LANG:",

                error.message

            );

            /* fallback safe */

            req.lang =
                DEFAULT_LANG;

            req.isDefaultLang =
                true;

            next();

        }

    };