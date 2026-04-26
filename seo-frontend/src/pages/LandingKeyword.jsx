import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useMemo, useEffect, useState } from "react";

/* ========================= */
/* 🌍 CITY FALLBACK MAP */
/* ========================= */
const COUNTRY_CITY_MAP = {
    fr: "paris",
    en: "london",
    es: "madrid",
    de: "berlin"
};

export default function LandingKeyword() {

    const { keyword: slug, lang } = useParams();
    const navigate = useNavigate();

    const [seoPage, setSeoPage] = useState(null);

    const currentLang = lang || "fr";

    /* ========================= */
    /* 🌍 DETECT USER CITY */
    /* ========================= */
    const detectedCity = useMemo(() => {
        try {
            const browserLang = navigator.language.split("-")[0];
            return COUNTRY_CITY_MAP[browserLang] || "paris";
        } catch {
            return "paris";
        }
    }, []);

    /* ========================= */
    /* 🔐 PARSE SLUG */
    /* ========================= */
    const { keyword, city } = useMemo(() => {

        if (!slug || typeof slug !== "string") {
            return { keyword: "", city: "" };
        }

        const parts = slug.split("-").filter(Boolean);

        // CAS 1 → seulement keyword
        if (parts.length === 1) {
            return {
                keyword: decodeURIComponent(parts[0]),
                city: detectedCity
            };
        }

        // CAS 2 → keyword + city
        const city = parts.pop();
        const keyword = parts.join(" ");

        return {
            keyword: decodeURIComponent(keyword),
            city: decodeURIComponent(city)
        };

    }, [slug, detectedCity]);

    /* ========================= */
    /* 🔄 AUTO REDIRECT SEO */
    /* ========================= */
    useEffect(() => {
        if (!slug) return;

        const parts = slug.split("-");

        if (parts.length === 1 && keyword && city) {
            navigate(`/${currentLang}/landing/${slug}-${city}`, { replace: true });
        }

    }, [slug, keyword, city, navigate, currentLang]);

    /* ========================= */
    /* 🔥 FETCH BACKEND SEO */
    /* ========================= */
    useEffect(() => {

        if (!slug) return;

        fetch(`http://localhost:3001/api/seo-page?slug=${slug}`)
            .then(res => res.json())
            .then(data => setSeoPage(data))
            .catch(() => setSeoPage(null));

    }, [slug]);

    /* ========================= */
    /* ❌ INVALID */
    /* ========================= */
    if (!keyword || !city) {
        return <div className="p-10 text-center">❌ Page invalide</div>;
    }

    /* ========================= */
    /* 🔤 FORMAT */
    /* ========================= */
    const capitalize = (str) =>
        str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

    const keywordLabel = capitalize(keyword);
    const cityLabel = capitalize(city);

    /* ========================= */
    /* 🔥 SEO META */
    /* ========================= */
    const title = `${keywordLabel} à ${cityLabel}`;
    const description = seoPage?.content?.slice(0, 155) || "";

    /* ========================= */
    /* 🔗 URL PROJET */
    /* ========================= */
    const projectUrl = `/${currentLang}/projet/${encodeURIComponent(keyword)}`;

    /* ========================= */
    /* UI */
    /* ========================= */
    return (
        <div className="max-w-4xl mx-auto p-10">

            {/* SEO */}
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Helmet>

            {/* TITLE */}
            <h1 className="text-4xl font-bold mb-4">
                🚀 {keywordLabel} à {cityLabel}
            </h1>

            {/* CONTENT */}
            {seoPage?.content ? (
                <div
                    className="prose max-w-none text-gray-700 mb-6"
                    dangerouslySetInnerHTML={{ __html: seoPage.content }}
                />
            ) : (
                <p className="text-gray-500">Chargement...</p>
            )}

            {/* CTA */}
            <div className="flex gap-4 flex-wrap mt-6">

                <button
                    onClick={() => navigate(projectUrl)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
                >
                    🚀 Lancer mon projet
                </button>

                <button
                    onClick={() => window.history.back()}
                    className="border px-6 py-3 rounded-xl"
                >
                    ← Retour
                </button>

            </div>

        </div>
    );
}