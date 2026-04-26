import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getNichesAI } from "../services/niche.service";
import { analyzeKeyword } from "../services/api";

export default function NichesPage() {

    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || "fr";
    const [loadingId, setLoadingId] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [niches, setNiches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generate = async () => {

        if (!keyword.trim()) return;

        setLoading(true);
        setError("");

        try {
            const data = await getNichesAI(keyword);

            console.log("NICHES API 👉", data);

            // ✅ FIX ULTRA SAFE
            let list = [];

            if (Array.isArray(data)) {
                list = data;
            } else if (Array.isArray(data?.niches)) {
                list = data.niches;
            } else if (Array.isArray(data?.data)) {
                list = data.data;
            } else {
                console.warn("⚠️ Mauvais format API:", data);
            }

            setNiches(list);

        } catch (err) {
            console.error("NICHES ERROR:", err);
            setError("Erreur lors de la génération");
            setNiches([]);
        } finally {
            setLoading(false);
        }
    };
    const handleAnalyze = async (k) => {

        if (!k) {
            console.warn("❌ keyword manquant");
            return;
        }

        try {
            console.log("👉 ANALYZE:", k);

            await analyzeKeyword(k);

            console.log("✅ NAVIGATE");

            navigate(`/${currentLang}/dashboard/keywords`);

        } catch (err) {

            console.error("ANALYZE ERROR:", err);

            // 🔥 fallback navigation même en cas d’erreur
            navigate(`/${currentLang}/dashboard/keywords`);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">

            <h1 className="text-3xl font-bold mb-4">
                🤖 Générateur de niches
            </h1>

            <div className="flex gap-3 mb-6">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="ex: niche fitness femme"
                    className="flex-1 border p-3 rounded"
                />

                <button
                    onClick={generate}
                    className="bg-purple-600 text-white px-5 rounded"
                >
                    {loading ? "⏳..." : "Générer"}
                </button>
            </div>

            {/* ❌ ERROR */}
            {error && (
                <p className="text-red-500 mb-4">{error}</p>
            )}

            {/* ⏳ LOADING */}
            {loading && (
                <p className="text-gray-500">Génération en cours...</p>
            )}

            {/* ✅ RESULT */}
            <div className="grid md:grid-cols-2 gap-4">

                {(Array.isArray(niches) ? niches : []).map((n, i) => (

                    <div key={i} className="bg-white p-4 rounded shadow">

                        <h3 className="font-bold">
                            {n?.keyword || "Niche"}
                        </h3>

                        <p className="text-sm text-gray-500">
                            {n?.business || "Aucune description"}
                        </p>

                        <button
                            onClick={async () => {
                                setLoadingId(i);

                                await handleAnalyze(n.keyword); // ✅ FIX

                                setLoadingId(null);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
                        >
                            {loadingId === i ? "⏳ Chargement..." : "Explorer"}
                        </button>
                    </div>
                ))}

            </div>

            {/* EMPTY */}
            {!loading && niches.length === 0 && (
                <p className="text-gray-400 mt-4">
                    Aucune niche trouvée
                </p>
            )}

        </div>
    );
}