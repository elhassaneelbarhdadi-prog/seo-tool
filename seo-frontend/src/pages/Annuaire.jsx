import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import useApi from "../hooks/useApi";

export default function Annuaire() {

    const api = useApi();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ========================= */
    /* 🔥 LOAD PROFILES */
    /* ========================= */
    useEffect(() => {

        const loadProfiles = async () => {
            try {
                setLoading(true);

                const data = await api.get("/business-profile");

                if (Array.isArray(data?.profiles)) {
                    setProfiles(data.profiles);
                } else {
                    setProfiles([]);
                }

            } catch (err) {
                console.error(err);
                setError("Impossible de charger l'annuaire");
            } finally {
                setLoading(false);
            }
        };

        loadProfiles();

    }, [api]);

    /* ========================= */
    /* 🔤 SLUG CLEAN (SEO SAFE) */
    /* ========================= */
    const slugify = (str) =>
        str
            ?.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // accents
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

    const buildSeoUrl = (keyword, city) => {
        if (!keyword || !city) return null;

        return `/${currentLang}/landing/${slugify(keyword)}-${slugify(city)}`;
    };

    /* ========================= */
    /* UI */
    /* ========================= */
    return (

        <div className="max-w-6xl mx-auto p-6">

            <h1 className="text-4xl font-bold mb-4">
                🚀 Attirez des clients grâce au SEO
            </h1>

            <p className="text-gray-600 mb-6">
                Soyez visible sur Google et recevez des visiteurs qualifiés prêts à acheter.
            </p>

            {/* ERROR */}
            {error && (
                <p className="text-red-500 mb-4">{error}</p>
            )}

            {/* LOADING */}
            {loading && (
                <p className="text-gray-500 mb-6">Chargement...</p>
            )}

            {/* LISTE */}
            <div className="grid md:grid-cols-2 gap-6">

                {!loading && profiles.length === 0 && (
                    <div className="col-span-2 text-center text-gray-500">
                        <p>Aucune entreprise pour le moment 👀</p>
                    </div>
                )}

                {profiles.map((p, i) => {

                    const seoUrl = buildSeoUrl(p.keyword, p.city);

                    return (
                        <div
                            key={p?.id || i}
                            className="bg-white p-6 rounded-2xl shadow border border-yellow-300 hover:shadow-lg transition"
                        >

                            <h2 className="text-xl font-bold mb-2">
                                #{i + 1} {p?.name}
                            </h2>

                            <p className="text-sm text-gray-500 mb-2">
                                📍 {p?.city}
                            </p>

                            <p className="mb-3 text-gray-700">
                                {p?.description}
                            </p>

                            <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded">
                                {p?.keyword}
                            </span>

                            {/* 🔥 SEO LINK (IMPORTANT) */}
                            {seoUrl && (
                                <Link
                                    to={seoUrl}
                                    className="block mt-4 w-full text-center bg-blue-600 text-white py-2 rounded-xl"
                                >
                                    🔍 Voir sur Google ({p.keyword} à {p.city})
                                </Link>
                            )}

                        </div>
                    );
                })}

            </div>

        </div>
    );
}