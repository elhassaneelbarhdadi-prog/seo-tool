import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useMemo } from "react";
import { useSeoData } from "../hooks/useSeoData";

/* ========================= */
/* 🔧 CLEAN */
/* ========================= */
const cleanKeywordFn = (str = "") => {
    return decodeURIComponent(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ");
};

const slugify = (str = "") => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
};

const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

const getScoreColor = (score) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-400";
    return "text-red-500";
};

const getDifficultyColor = (d) => {
    if (d >= 70) return "text-red-500";
    if (d >= 40) return "text-yellow-400";
    return "text-green-500";
};

export default function ProjectPage() {

    const { keyword, lang } = useParams();
    const navigate = useNavigate();

    const currentLang = lang || "fr";

    const cleanKeyword = useMemo(
        () => cleanKeywordFn(keyword),
        [keyword]
    );

    /* ========================= */
    /* 🔥 SLUG SAFE */
    /* ========================= */
    const city = "paris";
    const slug = `${slugify(cleanKeyword)}-${city}`;

    const { seo, loading } = useSeoData(slug);

    if (!cleanKeyword) {
        return <div className="p-10 text-center">❌ Projet invalide</div>;
    }

    if (loading) {
        return (
            <div className="p-10 text-center text-gray-500 animate-pulse">
                🔄 Analyse SEO en cours...
            </div>
        );
    }

    if (!seo) {
        return (
            <div className="p-10 text-center text-red-500">
                ❌ Données SEO indisponibles
            </div>
        );
    }

    const keywordLabel = capitalize(cleanKeyword);
    const scoreColor = getScoreColor(seo.score);
    const difficultyColor = getDifficultyColor(seo.difficulty);

    /* ========================= */
    /* 📈 TREND SAFE */
    /* ========================= */
    const safeTrend = Array.isArray(seo.trend) ? seo.trend : [];
    const maxTrend = safeTrend.length
        ? Math.max(...safeTrend)
        : 1;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            <Helmet>
                <title>{keywordLabel} - Opportunité SEO</title>
                <meta
                    name="description"
                    content={`Analyse SEO du mot-clé ${keywordLabel} : trafic, revenus et concurrence.`}
                />
            </Helmet>

            {/* HERO */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">

                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    🚀 {keywordLabel}
                </h1>

                <p className="opacity-90">
                    Opportunité business basée sur le SEO
                </p>

                <div className={`mt-4 text-5xl font-bold ${scoreColor}`}>
                    {seo.score}
                    <span className="text-lg ml-2">/100</span>
                </div>

                <p className="mt-2 opacity-80">
                    {seo.score > 70
                        ? "🔥 Opportunité forte"
                        : seo.score > 40
                            ? "⚖️ Opportunité moyenne"
                            : "❌ Faible potentiel"}
                </p>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">📈 Volume</p>
                    <p className="text-xl font-bold">{seo.volume}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">💰 CPC</p>
                    <p className="text-xl font-bold">{seo.cpc} €</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">💸 Revenus</p>
                    <p className="text-xl font-bold text-green-600">
                        {seo.revenue} €
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">⚔️ Difficulté</p>
                    <p className={`text-xl font-bold ${difficultyColor}`}>
                        {seo.difficulty}
                    </p>
                </div>

            </div>

            {/* DECISION */}
            <div className="bg-white p-6 rounded-xl shadow">

                <h2 className="font-bold mb-2">🧠 Recommandation</h2>

                <p className={`text-xl font-bold ${scoreColor}`}>
                    {seo.decision?.label}
                </p>

                <ul className="mt-3 text-gray-600">
                    {seo.reasons?.map((r, i) => (
                        <li key={i}>• {r}</li>
                    ))}
                </ul>

            </div>

            {/* TREND */}
            {safeTrend.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow">

                    <h2 className="font-bold mb-4">📈 Tendance</h2>

                    <div className="flex items-end gap-2 h-32">
                        {safeTrend.map((v, i) => (
                            <div
                                key={i}
                                className="bg-indigo-500 w-full rounded"
                                style={{ height: `${(v / maxTrend) * 100}%` }}
                            />
                        ))}
                    </div>

                </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-black to-gray-900 text-white p-8 rounded-2xl text-center shadow-xl">

                <h2 className="text-2xl font-bold mb-2">
                    🚀 Crée un business autour de "{keywordLabel}"
                </h2>

                <p className="opacity-80 mb-4">
                    Capture ce trafic et génère des revenus passifs
                </p>

                <button
                    onClick={() =>
                        navigate(`/${currentLang}/annuaire/${slug}`)
                    }
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
                >
                    🔥 Voir les opportunités SEO
                </button>

            </div>

        </div>
    );
}