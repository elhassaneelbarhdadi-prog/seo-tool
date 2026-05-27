import { generateFakeDomainData }
    from "../services/domain.service.js";

/* ========================= */
/* DOMAIN VALIDATION */
/* ========================= */

const isValidDomain = (
    domain
) => {

    return /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
        .test(domain);

};

/* ========================= */
/* GET DOMAIN DATA */
/* ========================= */

export const getDomainData =
    (req, res) => {

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

            let {
                domain = ""
            } = req.body;

            /* ========================= */
            /* VALIDATION */
            /* ========================= */

            domain =
                String(domain)
                    .trim()
                    .toLowerCase()
                    .slice(0, 255);

            if (
                !domain
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Domain requis"

                    });

            }

            if (
                !isValidDomain(
                    domain
                )
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Domain invalide"

                    });

            }

            /* ========================= */
            /* DATA */
            /* ========================= */

            const data =

                generateFakeDomainData(
                    domain
                );

            if (
                !data
            ) {

                throw new Error(
                    "No data generated"
                );

            }

            /* ========================= */
            /* RESPONSE */
            /* ========================= */

            return res.json({

                domain,

                ...data,

                source:
                    "simulated",

                simulated:
                    true

            });

        }

        catch (error) {

            console.error(

                "DOMAIN ERROR:",

                error.message

            );

            return res
                .status(500)
                .json({

                    error:
                        "Domain analysis error"

                });

        }

    };