import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getNichesAI } from "../services/niche.service";

export default function NichesPage() {

    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || "fr";

    const [loadingId, setLoadingId] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [niches, setNiches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isLimited, setIsLimited] = useState(false);

    /* ========================= */
    /* 🤖 GENERATE NICHES */
    /* ========================= */
    const generate = async () => {

        const clean = keyword.trim();

        if (!clean || loading) return;

        setLoading(true);
        setError("");
        setIsLimited(false);

        try {
            const res = await getNichesAI(clean);

            console.log("NICHES API 👉", res);

            /* ========================= */
            /* ✅ FORMAT CLEAN */
            /* ========================= */
            let list = [];

            if (Array.isArray(res)) {
                list = res;
            } else if (Array.isArray(res?.data)) {
                list = res.data;
            } else if (Array.isArray(res?.niches)) {
                list = res.niches;
            }

            setNiches(list);

            /* ========================= */
            /* 🔒 LIMIT PLAN */
            /* ========================= */
            if (res?.limited) {
                setIsLimited(true);
            }

            if (!list.length) {
                setError("Aucune niche trouvée");
            }

        } catch (err) {
            console.error("NICHES ERROR:", err);
            setError(err.message || "Erreur lors de la génération");
            setNiches([]);
        } finally {
            setLoading(false);
        }
    };

    /* ========================= */
    /* 🚀 NAVIGATE + ANALYZE */
    /* ========================= */
    const handleAnalyze = (k) => {

        if (!k) return;

        navigate(`/${currentLang}/dashboard/keywords`, {
            state: { autoKeyword: k }
        });
    };

    return (
        <div className="max-w-5xl mx-auto">

            <h1 className="text-3xl font-bold mb-4">
                🤖 Générateur de niches
            </h1>

            {/* INPUT */}
            <div className="flex gap-3 mb-6">

                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="ex: niche fitness femme"
                    className="flex-1 border p-3 rounded"
                />

                <button
                    onClick={generate}
                    disabled={loading || !keyword.trim()}
                    className="bg-purple-600 text-white px-5 rounded disabled:opacity-50"
                >
                    {loading ? "⏳ Génération..." : "Générer"}
                </button>

            </div>

            {/* ERROR */}
            {error && (
                <p className="text-red-500 mb-4 text-center">{error}</p>
            )}

            {/* LIMIT CTA */}
            {isLimited && (
                <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4 text-center">
                    🔒 Résultats limités (plan FREE)
                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard/pricing`)}
                        className="ml-3 underline font-bold"
                    >
                        Passer Premium
                    </button>
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <p className="text-gray-500 mb-4 text-center">
                    ⏳ Génération en cours...
                </p>
            )}

            {/* RESULT */}
            <div className="grid md:grid-cols-2 gap-4">

                {niches.map((n, i) => {

                    const nicheKeyword = n?.keyword;

                    return (
                        <div key={i} className="bg-white p-4 rounded shadow">

                            <h3 className="font-bold">
                                {nicheKeyword || "Niche"}
                            </h3>

                            <p className="text-sm text-gray-500">
                                {n?.business || "Aucune description"}
                            </p>

                            {nicheKeyword && (
                                <button
                                    onClick={() => {
                                        setLoadingId(i);
                                        handleAnalyze(nicheKeyword);

                                        setTimeout(() => setLoadingId(null), 300);
                                    }}
                                    disabled={loadingId !== null}
                                    className="bg-blue-600 text-white px-4 py-2 rounded mt-3 disabled:opacity-50"
                                >
                                    {loadingId === i
                                        ? "⏳ Chargement..."
                                        : "Explorer"}
                                </button>
                            )}

                        </div>
                    );
                })}

            </div>

            {/* EMPTY */}
            {!loading && niches.length === 0 && !error && (
                <p className="text-gray-400 mt-4 text-center">
                    Aucune niche trouvée
                </p>
            )}

        </div>
    );
}