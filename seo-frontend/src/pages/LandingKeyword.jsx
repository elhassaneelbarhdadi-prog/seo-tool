
import { Helmet } from "react-helmet";
import { useParams, useNavigate } from "react-router-dom";
import { useSeoData } from "../hooks/useSeoData";
import { useMemo } from "react";
import { formatNumber } from "../utils/format";

const capitalize = (s) =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export default function LandingKeyword() {

    const { keyword, lang = "fr" } = useParams();
    const navigate = useNavigate();

    const cleanKeyword = useMemo(
        () => decodeURIComponent(keyword || "").toLowerCase(),
        [keyword]
    );

    const slug = useMemo(
        () => cleanKeyword.replace(/\s+/g, "-"),
        [cleanKeyword]
    );

    const { seo, loading } = useSeoData(slug);

    if (!cleanKeyword) return null;

    if (loading) {
        return (
            <div className="p-10 text-center text-gray-500">
                ⏳ Analyse SEO en cours...
            </div>
        );
    }

    if (!seo) {
        return (
            <div className="p-10 text-center text-red-500">
                ❌ Données indisponibles
            </div>
        );
    }

    const k = capitalize(cleanKeyword);

    /* 🔒 SAFE DATA */
    const volume = Number(seo.volume) || 0;
    const cpc = Number(seo.cpc) || 0;
    const difficulty = Number(seo.difficulty) || 0;
    const score = Number(seo.score) || 0;

    /* 🔥 ROI REALISTE */
    const trafficPosition1 = Math.floor(volume * 0.28);

    const conversionRate =
        difficulty >= 70 ? 0.01 :
            difficulty >= 40 ? 0.02 :
                0.03;

    const avgOrderValue =
        cpc > 2 ? 120 :
            cpc > 1 ? 80 :
                40;

    const revenue =
        seo.revenue ??
        Math.floor(trafficPosition1 * conversionRate * avgOrderValue);

    const difficultyColor =
        difficulty > 70
            ? "text-red-500"
            : difficulty > 40
                ? "text-yellow-500"
                : "text-green-500";

    const scoreColor =
        score > 70
            ? "text-green-500"
            : score > 40
                ? "text-yellow-500"
                : "text-red-500";

    /* 🔥 SAFE TREND */
    const trend = Array.isArray(seo.trend) ? seo.trend : [10];
    const maxTrend = Math.max(...trend, 1);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            <Helmet>
                <title>{k} : analyse SEO complète</title>
                <meta
                    name="description"
                    content={`Analyse SEO du mot-clé ${k}. Volume, concurrence, revenus estimés.`}
                />
            </Helmet>

            {/* HERO */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    🚀 {k}
                </h1>

                <p className="opacity-90">
                    Opportunité SEO détectée
                </p>

                <div className={`text-5xl font-bold mt-4 ${scoreColor}`}>
                    {score}
                    <span className="text-lg ml-2">/100</span>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">📈 Volume</p>
                    <p className="text-xl font-bold">
                        {formatNumber(volume)}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">💰 CPC</p>
                    <p className="text-xl font-bold">
                        {cpc.toFixed(2)} €
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">💸 Revenus</p>
                    <p className="text-xl font-bold text-green-600">
                        {formatNumber(revenue)} €
                    </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <p className="text-gray-500 text-sm">⚔️ Difficulté</p>
                    <p className={`text-xl font-bold ${difficultyColor}`}>
                        {difficulty}
                    </p>
                </div>

            </div>

            {/* TREND */}
            <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="font-bold mb-4">📈 Tendance</h2>

                <div className="flex items-end gap-2 h-32">
                    {trend.map((v, i) => (
                        <div
                            key={i}
                            className="bg-indigo-500 w-full rounded"
                            style={{
                                height: `${(v / maxTrend) * 100}%`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-black to-gray-900 text-white p-8 rounded-2xl text-center shadow-xl">
                <h2 className="text-2xl font-bold mb-2">
                    🚀 Lance ton business sur "{k}"
                </h2>

                <button
                    onClick={() =>
                        navigate(`/${lang}/dashboard/keywords`, {
                            state: { autoKeyword: cleanKeyword }
                        })
                    }
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition"
                >
                    🔥 Analyser ce mot-clé
                </button>
            </div>

        </div>
    );
}