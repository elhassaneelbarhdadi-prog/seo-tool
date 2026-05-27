import axios from "axios";

/* ========================= */
/* CONFIG */
/* ========================= */

const SERPER_URL =
    "https://google.serper.dev/search";

const API_KEY =
    process.env.SERPER_API_KEY;

/* ========================= */
/* SERPER */
/* ========================= */

export async function fetchSerpData(
    keyword = ""
) {

    if (!keyword?.trim()) {

        throw new Error(
            "Keyword required"
        );

    }

    if (!API_KEY) {

        throw new Error(
            "SERPER_API_KEY missing"
        );

    }

    try {

        const response =
            await axios.post(

                SERPER_URL,

                {
                    q: keyword,
                    gl: "fr",
                    hl: "fr",
                    num: 10
                },

                {
                    timeout: 10000,

                    headers: {

                        "X-API-KEY":
                            API_KEY,

                        "Content-Type":
                            "application/json"

                    }

                }

            );

        return {

            organic:
                response.data?.organic || [],

            peopleAlsoAsk:
                response.data?.peopleAlsoAsk || [],

            relatedSearches:
                response.data?.relatedSearches || [],

            knowledgeGraph:
                response.data?.knowledgeGraph || null

        };

    } catch (error) {

        console.error(
            "SERPER FETCH ERROR:",
            error?.response?.data ||
            error.message
        );

        return {

            organic: [],

            peopleAlsoAsk: [],

            relatedSearches: [],

            knowledgeGraph: null

        };

    }

}