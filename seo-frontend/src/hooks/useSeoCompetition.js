
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
/* 🔥 HOOK CLEAN */
/* ========================= */
export function useSeoCompetition(result) {

    return useMemo(() => {

        const keyword = result?.keyword || "";
        const volume = result?.volume || 0;
        const revenueBase = result?.revenue || 0;

        if (!keyword) return [];

        /* ========================= */
        /* 🔥 SERP RÉELLE */
        /* ========================= */
        if (result?.serp?.length) {

            return result.serp.slice(0, 10).map((r, i) => {

                const domain =
                    r.link?.replace(/^https?:\/\//, "").split("/")[0] || "unknown";

                const hash = (str) =>
                    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

                const seed = hash(domain);

                let type = "media";

                if (domain.includes("amazon") || domain.includes("cdiscount")) {
                    type = "marketplace";
                } else if (domain.includes("shop") || domain.includes("store")) {
                    type = "ecommerce";
                } else if (domain.includes("blog")) {
                    type = "blog";
                }

                const authority = 40 + (seed % 60);

                /* ✅ basé sur backend */
                const traffic = Math.round(volume * (0.5 + (seed % 50) / 100));
                const revenue = Math.round(revenueBase * (0.5 + (seed % 50) / 100));

                return {
                    site: domain,
                    link: r.link,
                    type,
                    position: i + 1,
                    authority,
                    traffic,
                    revenue,
                    strategy: "SEO + contenu"
                };
            });
        }

        /* ========================= */
        /* 🔄 FALLBACK */
        /* ========================= */
        const intent = detectIntent(keyword);
        const niche = keyword.replaceAll(" ", "-");

        if (intent === "ecommerce") {
            return [
                {
                    site: "amazon.fr",
                    type: "marketplace",
                    position: 1,
                    authority: 95,
                    traffic: volume * 10,
                    revenue: revenueBase * 10,
                    strategy: "Marketplace + Ads"
                },
                {
                    site: `${niche}-shop.com`,
                    type: "ecommerce",
                    position: 2,
                    authority: 65,
                    traffic: volume,
                    revenue: revenueBase,
                    strategy: "Niche + SEO"
                }
            ];
        }

        if (intent === "affiliate") {
            return [
                {
                    site: "media-site.com",
                    type: "media",
                    position: 1,
                    authority: 80,
                    traffic: volume * 2,
                    revenue: revenueBase * 2,
                    strategy: "Comparatif + affiliation"
                }
            ];
        }

        if (intent === "blog") {
            return [
                {
                    site: "blog-expert.com",
                    type: "blog",
                    position: 1,
                    authority: 70,
                    traffic: volume,
                    revenue: revenueBase * 0.5,
                    strategy: "SEO contenu"
                }
            ];
        }

        return [
            {
                site: `${niche}-site.com`,
                type: "mixed",
                position: 1,
                authority: 60,
                traffic: volume,
                revenue: revenueBase,
                strategy: "SEO niche"
            }
        ];

    }, [result]);
}