import { useState } from "react";
import { API_BASE } from "../config";

export default function Annuaire() {
    const [search, setSearch] = useState("");
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");

    const loadBusinesses = async () => {
        if (!search.trim()) {
            setBusinesses([]);
            setHasSearched(false);
            return;
        }

        try {
            setLoading(true);
            setError("");
            setHasSearched(true);

            const response = await fetch(
                `${API_BASE}/business-profile?search=${encodeURIComponent(
                    search
                )}`
            );

            let data = null;
            try {
                data = await response.json();
            } catch {
                throw new Error("Réponse JSON invalide");
            }

            if (!response.ok) {
                throw new Error(data?.error || `HTTP ${response.status}`);
            }

            console.log("✅ BUSINESSES:", data);

            setBusinesses(data.businesses || data.profiles || []);
        } catch (err) {
            console.error("❌ LOAD BUSINESSES ERROR:", err);

            setError("Impossible de charger les entreprises.");
            setBusinesses([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* HERO */}
            <div className="text-center mb-14">
                <h1 className="text-5xl lg:text-6xl font-black mb-6">
                    📁 Annuaire SEO
                </h1>

                <p className="text-gray-500 text-lg max-w-3xl mx-auto">
                    Découvrez les meilleures entreprises
                    référencées dans notre annuaire SEO.
                </p>
            </div>

            {/* SEARCH */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-12">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        id="business-search"
                        name="business-search"
                        type="text"
                        value={search}
                        placeholder="Ex : hijama, bien-être, plombier..."
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                loadBusinesses();
                            }
                        }}
                        className="
                            flex-1
                            border-2
                            border-gray-200
                            rounded-full
                            px-6
                            py-4
                            text-lg
                            focus:outline-none
                            focus:border-blue-500
                        "
                    />

                    <button
                        onClick={loadBusinesses}
                        disabled={loading}
                        className="
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            px-8
                            py-4
                            rounded-full
                            font-bold
                            transition
                            disabled:opacity-50
                        "
                    >
                        {loading ? "⏳ Chargement..." : "🔍 Rechercher"}
                    </button>
                </div>
            </div>

            {/* STATS */}
            {businesses.length > 0 && (
                <div className="mb-8">
                    <p className="text-gray-500">
                        📊 {businesses.length} entreprise(s) trouvée(s)
                    </p>
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div
                    className="
                    bg-red-50
                    border
                    border-red-200
                    text-red-600
                    p-4
                    rounded-2xl
                    mb-8
                "
                >
                    {error}
                </div>
            )}

            {/* EMPTY */}
            {hasSearched && !loading && businesses.length === 0 && (
                <div
                    className="
                        bg-gray-50
                        rounded-3xl
                        text-center
                        py-16
                        text-gray-400
                        border
                    "
                >
                    Aucun résultat trouvé
                </div>
            )}

            {/* RESULTS */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {businesses.map((business, index) => (
                    <div
                        key={business.id || index}
                        className="
                            bg-white
                            rounded-3xl
                            shadow-md
                            hover:shadow-xl
                            transition
                            border
                            p-6
                        "
                    >
                        <h2 className="text-2xl font-bold mb-2">
                            {business.name}
                        </h2>

                        <p className="text-gray-500 mb-4">
                            📍 {business.city || "Ville inconnue"}
                        </p>

                        {business.description && (
                            <p className="text-gray-700 mb-4">
                                {business.description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {business.keyword && (
                                <span
                                    className="
                                        bg-blue-100
                                        text-blue-700
                                        px-3
                                        py-1
                                        rounded-full
                                        text-sm
                                        font-medium
                                    "
                                >
                                    {business.keyword}
                                </span>
                            )}

                            {business.score && (
                                <span
                                    className="
                                        bg-green-100
                                        text-green-700
                                        px-3
                                        py-1
                                        rounded-full
                                        text-sm
                                        font-medium
                                    "
                                >
                                    SEO Score : {business.score}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div
                className="
                mt-16
                bg-gradient-to-r
                from-blue-600
                to-indigo-600
                text-white
                rounded-3xl
                p-10
                text-center
            "
            >
                <h2 className="text-3xl font-bold mb-4">
                    🚀 Référencez votre entreprise
                </h2>

                <p className="mb-6 opacity-90">
                    Rejoignez notre annuaire SEO et gagnez
                    en visibilité sur Google.
                </p>

                <button
                    onClick={() => {
                        window.location.href =
                            "/fr/dashboard/business-profile";
                    }}
                    className="
                        bg-white
                        text-blue-600
                        px-6
                        py-3
                        rounded-full
                        font-bold
                    "
                >
                    Ajouter mon entreprise
                </button>
            </div>
        </div>
    );
}