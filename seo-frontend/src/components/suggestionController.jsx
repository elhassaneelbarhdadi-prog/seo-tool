
import axios from "axios";

export const getSuggestions = async (req, res) => {
    try {
        const keyword = req.query.keyword?.trim();

        /* ========================= */
        /* 🔒 VALIDATION */
        /* ========================= */
        if (!keyword) {
            return res.status(400).json({
                success: false,
                error: "Keyword is required"
            });
        }

        /* ========================= */
        /* 🌍 GOOGLE SUGGEST */
        /* ========================= */
        const url = "https://suggestqueries.google.com/complete/search";

        const response = await axios.get(url, {
            params: {
                client: "firefox",
                q: keyword
            },
            timeout: 5000 // ✅ évite blocage serveur
        });

        let suggestions = response.data?.[1] || [];

        /* ========================= */
        /* 🧹 CLEAN DATA */
        /* ========================= */
        suggestions = suggestions
            .filter(s => typeof s === "string")
            .map(s => s.toLowerCase())
            .filter((s, i, arr) => arr.indexOf(s) === i) // remove duplicates
            .slice(0, 10); // limite

        /* ========================= */
        /* 🚀 RESPONSE */
        /* ========================= */
        res.json({
            success: true,
            keyword,
            count: suggestions.length,
            suggestions
        });

    } catch (error) {
        console.error("❌ Suggestions error:", error.message);

        res.status(500).json({
            success: false,
            error: "Error fetching suggestions"
        });
    }
};