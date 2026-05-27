import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useEffect, useState, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/* ========================= */
/* 🔥 CLEAN KEYWORD */
/* ========================= */
const cleanKeyword = (str = "") => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^(a|à|de|d'|du|des)\s+/i, "")
        .trim()
        .replace(/\s+/g, " ");
};

/* ========================= */
/* 🔤 FORMAT */
/* ========================= */
const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

export default function AnnuairePage() {

    const { slug, lang = "fr" } = useParams();

    const [profiles, setProfiles] = useState([]);
    const [seoPage, setSeoPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    /* ========================= */
    /* 🔐 PARSE SLUG (ROBUSTE) */
    /* ========================= */
    const { keyword, city } = useMemo(() => {

        if (!slug) return { keyword: "", city: "" };

        const parts = slug.split("-").filter(Boolean);

        if (parts.length < 2) return { keyword: "", city: "" };

        return {
            keyword: cleanKeyword(parts.slice(0, -1).join(" ")),
            city: parts.slice(-1).join("-")
        };

    }, [slug]);

    const isInvalid = !keyword || !city;

    const keywordLabel = capitalize(keyword);
    const cityLabel = capitalize(city);

    /* ========================= */
    /* 🔥 LOAD DATA (PARALLÈLE) */
    /* ========================= */
    useEffect(() => {

        if (isInvalid) return;

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const [seoRes, profilesRes] = await Promise.all([
                    fetch(`${API_URL}/seo-page?slug=${slug}`),
                    fetch(`${API_URL}/business-profile`)
                ]);

                const seoData = await seoRes.json();
                const profilesData = await profilesRes.json();

                if (cancelled) return;

                setSeoPage(seoData);

                if (Array.isArray(profilesData?.profiles)) {

                    const filtered = profilesData.profiles.filter(p => {

                        const k = cleanKeyword(p?.keyword || "");
                        const c = (p?.city || "").toLowerCase();

                        return (
                            (k.includes(keyword) || keyword.includes(k)) &&
                            c.includes(city)
                        );
                    });

                    setProfiles(filtered);
                } else {
                    setProfiles([]);
                }

            } catch (err) {
                console.error(err);
                if (!cancelled) setError("Erreur de chargement");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => { cancelled = true };

    }, [slug, keyword, city, isInvalid]);

    if (isInvalid) {
        return <div className="p-10 text-center">❌ Page invalide</div>;
    }

    /* ========================= */
    /* 🔥 SEO META */
    /* ========================= */
    const title = `${keywordLabel} à ${cityLabel} | Meilleurs services`;

    const description =
        seoPage?.content?.replace(/<[^>]+>/g, "").slice(0, 155) ||
        `Trouvez les meilleurs ${keyword} à ${cityLabel}`;

    return (
        <div className="max-w-4xl mx-auto p-10">

            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Helmet>
            {error && (
                <div className="
        bg-red-50
        border
        border-red-200
        text-red-600
        p-4
        rounded-xl
        mb-6
    ">
                    {error}
                </div>
            )}
            <div className="text-center mb-10">

                <h1 className="
        text-4xl
        lg:text-5xl
        font-black
        mb-4
    ">
                    📁 Annuaire SEO des entreprises
                </h1>

                <p className="
        text-gray-500
        text-lg
        max-w-3xl
        mx-auto
        mb-6
    ">
                    Découvrez les meilleurs
                    {` ${keywordLabel} `}
                    à
                    {` ${cityLabel} `}
                    référencés dans notre annuaire SEO professionnel.
                </p>

            </div>

            {/* ========================= */}
            {/* 🔥 SEO CONTENT */}
            {/* ========================= */}
            {loading ? (
                <p className="text-gray-500 mb-6">Chargement...</p>
            ) : seoPage?.content ? (
                <div
                    className="text-gray-700 mb-6 space-y-4"
                    dangerouslySetInnerHTML={{
                        __html: seoPage.content.replace(/<script.*?>.*?<\/script>/gi, "")
                    }}
                />
            ) : (
                <p className="text-red-500 mb-6">Contenu SEO indisponible</p>
            )}

            {/* ========================= */}
            {/* 🔥 SEO DATA */}
            {/* ========================= */}
            {seoPage && (
                <div className="bg-green-50 p-4 rounded-xl mb-6 space-y-2">

                    <p>
                        💰 Potentiel estimé :{" "}
                        <strong>
                            {seoPage.revenue
                                ? `${seoPage.revenue.toLocaleString()}€ / mois`
                                : "Non estimé"}
                        </strong>
                    </p>

                    <p>
                        ⚔️ Concurrence :{" "}
                        <strong>
                            {seoPage.competition
                                ? `${seoPage.competition}/100`
                                : "Non disponible"}
                        </strong>
                    </p>

                </div>
            )}

            {/* ========================= */}
            {/* LISTING */}
            {/* ========================= */}
            {!loading && profiles.length === 0 && (
                <div className="bg-gray-100 p-4 rounded-xl mb-8 text-center">
                    Aucun professionnel trouvé pour {keywordLabel} à {cityLabel}
                </div>
            )}

            {profiles.length > 0 && (
                <div className="space-y-4 mb-10">

                    <h2 className="text-2xl font-bold">
                        🔝 Meilleurs professionnels à {cityLabel}
                    </h2>

                    {profiles.map((p, i) => (
                        <div key={p.id || i} className="bg-white p-4 rounded-xl shadow">

                            <h3 className="font-semibold text-lg">
                                {p.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                                📍 {p.city}
                            </p>

                            <p className="text-gray-700">
                                {p.description}
                            </p>

                        </div>
                    ))}

                </div>
            )}

            {/* CTA */}
            <div className="bg-indigo-50 p-6 rounded-xl mb-10">
                <p className="font-semibold mb-2">
                    🚀 Recevez des clients en SEO
                </p>

                <Link
                    to={`/${lang}/register`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                    🚀 S’inscrire gratuitement
                </Link>
            </div>

        </div>
    );
}