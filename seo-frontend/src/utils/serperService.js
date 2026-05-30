import axios from "axios";

export async function searchGoogle(keyword) {

    try {

        const response = await axios.post(
            "https://google.serper.dev/search",
            {
                q: keyword,
                gl: "fr",
                hl: "fr"
            },
            {
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "SERPER ERROR:",
            error.response?.data || error.message
        );

        throw error;

    }

}