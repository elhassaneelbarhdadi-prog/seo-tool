import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
    analyzeKeywordFree
} from "../services/api";

const FREE_LIMIT = 5;

export default function FreeAnalyzer() {

    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    const [keyword, setKeyword] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const used = Number(
        localStorage.getItem("free_search_count") || 0
    );

    const handleAnalyze = async () => {

        if (!keyword.trim()) {
            return;
        }

        if (used >= FREE_LIMIT) {

            navigate(`/${lang}/register`);

            return;
        }

        setLoading(true);
        setError("");

        try {

            const data =
                await analyzeKeywordFree(
                    keyword.trim()
                );
            setResult(data);

            localStorage.setItem(
                "free_search_count",
                used + 1
            );

        } catch (err) {

            setError(
                err.message || "Erreur analyse"
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-gray-50 p-6">

            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-xl">

                <h1 className="text-4xl font-bold mb-4">
                    🚀 Analyse SEO gratuite
                </h1>

                <p className="text-gray-600 mb-8">
                    Testez gratuitement 5 analyses SEO avant de créer un compte.
                </p>

                <div className="flex gap-3 mb-4">

                    <input
                        value={keyword}
                        onChange={(e) =>
                            setKeyword(e.target.value)
                        }
                        placeholder="Ex: plombier paris"
                        className="flex-1 border rounded-xl px-4 py-3"
                    />

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-indigo-600 text-white px-6 rounded-xl"
                    >
                        {loading ? "⏳" : "Analyser"}
                    </button>

                </div>

                <p className="text-sm text-gray-500 mb-8">
                    {used} / {FREE_LIMIT} analyses utilisées
                </p>

                {error && (

                    <div className="bg-red-100 text-red-600 p-4 rounded-xl mb-6">
                        {error}
                    </div>

                )}

                {result && (

                    <div className="space-y-4 border-t pt-6">

                        <h2 className="text-2xl font-bold">
                            Résultat
                        </h2>

                        <p>
                            <strong>Score SEO :</strong> {result.scoreFinal}
                        </p>

                        <p>
                            <strong>Volume :</strong> {result.volume}
                        </p>

                        <p>
                            <strong>CPC :</strong> {result.cpc}
                        </p>

                        <p>
                            <strong>Difficulté :</strong> {result.competition}
                        </p>

                    </div>

                )}

            </div>

        </div>

    );

}