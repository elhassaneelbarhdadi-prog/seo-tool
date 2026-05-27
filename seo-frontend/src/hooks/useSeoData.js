import { useEffect, useState } from "react";

/* ========================= */
/* 🔥 HOOK SEO (PRODUCTION) */
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

        const fetchSEO = async () => {

            try {
                setData(prev => ({ ...prev, loading: true }));

                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/seo-page?slug=${slug}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!res.ok) {

                    if (res.status === 403) {
                        throw new Error("LIMIT_REACHED");
                    }

                    throw new Error("API_ERROR");
                }

                const json = await res.json();

                if (!cancelled) {
                    setData({
                        seo: json,
                        loading: false,
                        error: null
                    });
                }

            } catch (e) {
                console.error("SEO ERROR:", e.message);

                if (!cancelled) {
                    setData({
                        seo: null,
                        loading: false,
                        error: e.message
                    });
                }
            }
        };

        fetchSEO();

        return () => {
            cancelled = true;
        };

    }, [slug]);

    return data;
}