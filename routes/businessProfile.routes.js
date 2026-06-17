import { useState, useEffect } from "react";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://seo-tool-api-lo6k.onrender.com";

export default function Annuaire() {

    const [search, setSearch] = useState("");
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadBusinesses = async () => {

        try {

            setLoading(true);
            setError("");

            const url = search.trim()
                ? `${API_URL}/api/business-profile?search=${encodeURIComponent(search)}`
                : `${API_URL}/api/business-profile`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            console.log("✅ BUSINESSES:", data);

            setBusinesses(
                data.businesses || []
            );

        } catch (err) {

            console.error(
                "❌ LOAD BUSINESSES ERROR:",
                err
            );

            setError(
                "Impossible de charger les entreprises."
            );

            setBusinesses([]);

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadBusinesses();
    }, []);

    return (

        <div className="max-w-6xl mx-auto px-6 py-12">

            {/* HEADER */}

            <div className="text-center mb-12">

                <h1 className="text-5xl font-black mb-4">
                    📁 Annuaire SEO
                </h1>

                <p className="text-gray-500 text-lg max-w-3xl mx-auto">
                    Découvrez les meilleures entreprises
                    référencées dans notre annuaire SEO.
                </p>

            </div>

            {/* SEARCH */}

            <div className="flex flex-col md:flex-row gap-4 mb-10">

                <input
                    id="business-search"
                    name="business-search"
                    type="text"
                    value={search}
                    placeholder="Ex : hijama, bien-être, médecine..."
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            loadBusinesses();
                        }
                    }}
                    className="
                        flex-1
                        border-2
                        border-gray-300
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
                        disabled:opacity-50
                    "
                >
                    {loading
                        ? "Chargement..."
                        : "🔍 Rechercher"}
                </button>

            </div>

            {/* ERROR */}

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

            {/* EMPTY */}

            {!loading &&
                businesses.length === 0 && (

                    <div className="
                        text-center
                        text-gray-400
                        py-16
                    ">
                        Aucun résultat
                    </div>

                )}

            {/* RESULTS */}

            <div className="grid md:grid-cols-2 gap-6">

                {businesses.map((business) => (

                    <div
                        key={business.id}
                        className="
                            bg-white
                            rounded-3xl
                            shadow-md
                            border
                            p-6
                            hover:shadow-xl
                            transition
                        "
                    >

                        <h2 className="text-2xl font-bold">

                            {business.name}

                        </h2>

                        <p className="text-gray-500 mt-2">

                            📍 {business.city}

                        </p>

                        {business.description && (

                            <p className="mt-4 text-gray-700">

                                {business.description}

                            </p>

                        )}

                        <div className="flex flex-wrap gap-2 mt-4">

                            {business.keyword && (

                                <span
                                    className="
                                        bg-blue-100
                                        text-blue-700
                                        px-3
                                        py-1
                                        rounded-full
                                        text-sm
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
                                    "
                                >
                                    SEO Score : {business.score}
                                </span>

                            )}

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );
}