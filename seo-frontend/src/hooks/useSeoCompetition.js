
import { useMemo } from "react";

/* ========================= */
/* 🎯 INTENTION */
/* ========================= */
const detectIntent = (keyword = "") => {
    const k = keyword.toLowerCase();

    if (/(acheter|prix|boutique|shop|pas cher)/.test(k)) return "ecommerce";
    if (/(avis|test|comparatif|meilleur)/.test(k)) return "affiliate";
    if (/(comment|guide|astuce)/.test(k)) return "blog";

    return "mixed";
};

/* ========================= */
/* 🧠 TYPE DOMAINE */
/* ========================= */
const detectType = (domain = "") => {
    const d = domain.toLowerCase();

    if (/(amazon|cdiscount|fnac)/.test(d)) return "marketplace";
    if (/(shop|store|boutique)/.test(d)) return "ecommerce";
    if (/(blog|magazine|media)/.test(d)) return "media";

    return "site";
};

/* ========================= */
/* 🔥 HOOK */
/* ========================= */
export function useSeoCompetition(result) {

    return useMemo(() => {

        const keyword = result?.keyword || "";
        const volume = Number(result?.volume) || 0;
        const revenueBase = Number(result?.revenue) || 0;

        if (!keyword) return [];

        /* ========================= */
        /* 🔥 SERP RÉELLE */
        /* ========================= */
        if (Array.isArray(result?.serp) && result.serp.length > 0) {

            return result.serp.slice(0, 10).map((r, i) => {

                const domain =
                    r.link?.replace(/^https?:\/\//, "").split("/")[0] || "unknown";

                // 🔒 hash stable
                const seed = domain
                    .split("")
                    .reduce((acc, c) => acc + c.charCodeAt(0), 0);

                const type = detectType(domain);

                // ✅ authority plus réaliste
                const authority = Math.min(95, 30 + (seed % 65));

                // ✅ trafic basé position (IMPORTANT)
                const positionFactor = 1 - (i * 0.08); // top 1 = 100%, top 10 ≈ 20%

                const traffic = Math.max(
                    10,
                    Math.round(volume * positionFactor * 0.3)
                );

                const revenue = Math.max(
                    1,
                    Math.round(revenueBase * positionFactor * 0.3)
                );

                return {
                    site: domain,
                    link: r.link,
                    type,
                    position: i + 1,
                    authority,
                    traffic,
                    revenue,
                    strategy:
                        type === "marketplace"
                            ? "Ads + SEO produit"
                            : "SEO + contenu"
                };
            });
        }

        /* ========================= */
        /* 🔄 FALLBACK INTELLIGENT */
        /* ========================= */
        const intent = detectIntent(keyword);
        const niche = keyword.replaceAll(" ", "-");

        const baseTraffic = Math.max(50, volume * 0.3);
        const baseRevenue = Math.max(10, revenueBase * 0.3);

        switch (intent) {

            case "ecommerce":
                return [
                    {
                        site: "amazon.fr",
                        type: "marketplace",
                        position: 1,
                        authority: 95,
                        traffic: baseTraffic * 2,
                        revenue: baseRevenue * 2,
                        strategy: "Marketplace + Ads"
                    },
                    {
                        site: `${niche}-shop.com`,
                        type: "ecommerce",
                        position: 2,
                        authority: 60,
                        traffic: baseTraffic,
                        revenue: baseRevenue,
                        strategy: "Niche + SEO"
                    }
                ];

            case "affiliate":
                return [
                    {
                        site: `${niche}-comparatif.com`,
                        type: "media",
                        position: 1,
                        authority: 75,
                        traffic: baseTraffic,
                        revenue: baseRevenue,
                        strategy: "Comparatif + affiliation"
                    }
                ];

            case "blog":
                return [
                    {
                        site: `${niche}-blog.com`,
                        type: "blog",
                        position: 1,
                        authority: 65,
                        traffic: baseTraffic,
                        revenue: baseRevenue * 0.5,
                        strategy: "SEO contenu"
                    }
                ];

            default:
                return [
                    {
                        site: `${niche}-site.com`,
                        type: "mixed",
                        position: 1,
                        authority: 55,
                        traffic: baseTraffic,
                        revenue: baseRevenue,
                        strategy: "SEO niche"
                    }
                ];
        }

    }, [result]);
}