
import axios from "axios";

export const getSuggestions = async (req, res) => {
    try {
        const { keyword } = req.query;

        // 🔒 validation
        if (!keyword || keyword.trim() === "") {
            return res.status(400).json({
                error: "Keyword is required"
            });
        }

        const url = "https://suggestqueries.google.com/complete/search";

        const response = await axios.get(url, {
            params: {
                client: "firefox",
                q: keyword
            }
        });

        const suggestions = response.data?.[1] || [];

        res.json({
            success: true,
            keyword,
            suggestions
        });

    } catch (error) {
        console.error("Suggestions error:", error.message);

        res.status(500).json({
            error: "Error fetching suggestions"
        });
    }
};