// routes/googleads.test.js

import express from "express";
import { GoogleAdsApi } from "google-ads-api";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ========================= */
/* DEV ONLY */
/* ========================= */

const canUseRoute = (req) => {

    return (

        process.env.NODE_ENV
        === "development"

        ||

        req.user?.isAdmin
        === true

    );

};

const devGuard =
    (req, res, next) => {

        if (
            !canUseRoute(req)
        ) {

            return res
                .status(403)
                .json({

                    error:
                        "Forbidden"

                });

        }

        next();

    };

/* ========================= */
/* GOOGLE ADS CLIENT */
/* ========================= */

const customerId =

    process.env
        .GOOGLE_ADS_CUSTOMER_ID

        ?.replace(/-/g, "")
        ?.trim();

if (
    process.env.NODE_ENV
    === "development"
) {

    console.log(
        "GOOGLE ADS READY:",
        !!customerId
    );

}

const client =
    new GoogleAdsApi({

        client_id:
            process.env
                .GOOGLE_ADS_CLIENT_ID,

        client_secret:
            process.env
                .GOOGLE_ADS_CLIENT_SECRET,

        developer_token:
            process.env
                .GOOGLE_ADS_DEVELOPER_TOKEN

    });

const customer =

    client.Customer({

        customer_id:
            customerId,

        refresh_token:
            process.env
                .GOOGLE_ADS_REFRESH_TOKEN

    });

/* ========================= */
/* TEST */
/* ========================= */

router.get(

    "/real-keywords",

    authMiddleware,

    devGuard,

    async (
        req,
        res
    ) => {

        try {

            const keyword =

                String(

                    req.query.q
                    ||
                    "plombier paris"

                )

                    .trim()

                    .slice(
                        0,
                        100
                    );

            const result =

                await customer
                    .keywordPlanIdeas
                    .generateKeywordIdeas({

                        language:
                            "1000",

                        geo_target_constants: [

                            "geoTargetConstants/2250"

                        ],

                        keyword_seed: {

                            keywords: [
                                keyword
                            ]

                        }

                    });

            const formatted =

                result

                    .slice(0, 10)

                    .map(

                        item => ({

                            keyword:
                                item.text || "",

                            volume:

                                item
                                    .keyword_idea_metrics
                                    ?.avg_monthly_searches

                                ?? 0,

                            competition:

                                item
                                    .keyword_idea_metrics
                                    ?.competition

                                ?? null,

                            cpc_low:

                                item
                                    .keyword_idea_metrics
                                    ?.low_top_of_page_bid_micros

                                    ?

                                    item
                                        .keyword_idea_metrics
                                        .low_top_of_page_bid_micros
                                    / 1000000

                                    : 0,

                            cpc_high:

                                item
                                    .keyword_idea_metrics
                                    ?.high_top_of_page_bid_micros

                                    ?

                                    item
                                        .keyword_idea_metrics
                                        .high_top_of_page_bid_micros
                                    / 1000000

                                    : 0

                        })

                    );

            return res.json({

                source:
                    "google_ads",

                real_data: true,

                keyword,

                total:
                    formatted.length,

                data:
                    formatted

            });

        }

        catch (error) {

            console.error(

                "GOOGLE ADS:",

                error.message

            );

            return res
                .status(500)
                .json({

                    success: false,

                    error:
                        "Google Ads failed"

                });

        }

    }

);

export default router;