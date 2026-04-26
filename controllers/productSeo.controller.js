import { estimateSEO } from "../utils/seoEstimator.js";

export const getProductsSeo = async (req, res) => {
    try {

        const baseProducts = [
            {
                id: 1,
                name: "Tapis Yoga",
                keyword: "tapis yoga liège"
            },
            {
                id: 2,
                name: "Sac de frappe",
                keyword: "sac de frappe boxe"
            }
        ];

        const products = baseProducts.map(p => {

            const seo = estimateSEO(p.keyword);

            return {
                ...p,
                volume: seo.volume,
                cpc: seo.cpc,
                revenue: seo.revenue,
                competition: seo.competition,
                score: seo.score
            };
        });

        res.json(products);

    } catch (error) {

        console.error("Product SEO error:", error);

        res.status(500).json({
            error: "Server error"
        });

    }
};