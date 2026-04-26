import { useEffect, useState } from "react";
console.log("SEO HOOK LOADED");
/* ========================= */
/* 🔥 HOOK GLOBAL SEO */
/* ========================= */
export function useSeoData(slug) {

    const [data, setData] = useState({
        seo: null,
        loading: true,
        error: null
    });

    useEffect(() => {

        if (!slug) return;

        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3001/api/seo-page?slug=${slug}`
                );

                const json = await res.json();

                if (!cancelled) {
                    setData({
                        seo: json,
                        loading: false,
                        error: null
                    });
                }

            } catch (e) {
                if (!cancelled) {
                    setData({
                        seo: null,
                        loading: false,
                        error: "Erreur API"
                    });
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };

    }, [slug]);

    return data;
}