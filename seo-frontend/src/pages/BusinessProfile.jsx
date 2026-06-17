import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "../services/api";

export default function BusinessProfile() {
    const navigate = useNavigate();
    const { lang: currentLang = "fr" } = useParams();

    const [form, setForm] = useState({
        name: "",
        keyword: "",
        city: "",
        description: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const isValid = () => {
        return (
            form.name.trim() &&
            form.keyword.trim() &&
            form.city.trim()
        );
    };

    const goAnnuaire = () => {
        navigate(`/${currentLang}/dashboard/annuaire`);
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!isValid()) {
            setError("Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);

        try {
            const data = await request("/business-profile", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name.trim(),
                    keyword: form.keyword.trim(),
                    city: form.city.trim(),
                    description: form.description.trim()
                })
            });

            if (data?.alreadyExists) {
                setError("⚠️ Vous avez déjà une fiche entreprise.");
                setTimeout(goAnnuaire, 1500);
                return;
            }

            setSuccess("✅ Votre fiche entreprise a été créée avec succès.");

            setForm({
                name: "",
                keyword: "",
                city: "",
                description: ""
            });

            setTimeout(goAnnuaire, 1200);

        } catch (err) {
            console.error("CREATE PROFILE ERROR:", err);

            if (
                err?.message?.includes("upgrade") ||
                err?.status === 403
            ) {
                navigate(`/${currentLang}/dashboard/pricing`);
                return;
            }

            setError(
                err?.message || "❌ Une erreur est survenue."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">

            {/* HERO */}

            <div className="text-center mb-12">

                <div className="text-6xl mb-4">
                    🚀
                </div>

                <h1 className="text-5xl font-black mb-4">
                    Référencez votre entreprise
                </h1>

                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Apparaissez dans notre annuaire SEO,
                    améliorez votre visibilité sur Google
                    et obtenez davantage de clients.
                </p>

            </div>

            {/* CARD */}

            <div className="bg-white rounded-3xl shadow-xl border p-8">

                {/* ALERTS */}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-2xl mb-6">
                        {success}
                    </div>
                )}

                {/* FORM */}

                <div className="space-y-6">

                    <div>
                        <label className="block mb-2 font-semibold">
                            Nom de l'entreprise *
                        </label>

                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Ex : Médecine Traditionnelle Hijama"
                            className="
                                w-full
                                border-2
                                border-gray-200
                                rounded-2xl
                                px-4
                                py-3
                                focus:outline-none
                                focus:border-blue-500
                            "
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">
                            Mot-clé principal *
                        </label>

                        <input
                            id="keyword"
                            name="keyword"
                            value={form.keyword}
                            onChange={handleChange}
                            placeholder="Ex : hijama"
                            className="
                                w-full
                                border-2
                                border-gray-200
                                rounded-2xl
                                px-4
                                py-3
                                focus:outline-none
                                focus:border-blue-500
                            "
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">
                            Ville *
                        </label>

                        <input
                            id="city"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            placeholder="Ex : Guesnain"
                            className="
                                w-full
                                border-2
                                border-gray-200
                                rounded-2xl
                                px-4
                                py-3
                                focus:outline-none
                                focus:border-blue-500
                            "
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">
                            Description
                        </label>

                        <textarea
                            id="description"
                            name="description"
                            rows={5}
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Décrivez votre activité..."
                            className="
                                w-full
                                border-2
                                border-gray-200
                                rounded-2xl
                                px-4
                                py-3
                                resize-none
                                focus:outline-none
                                focus:border-blue-500
                            "
                        />

                        <div className="text-right text-sm text-gray-400 mt-2">
                            {form.description.length} caractères
                        </div>
                    </div>

                    {/* INFO PRO */}

                    <div className="
                        bg-gradient-to-r
                        from-yellow-50
                        to-orange-50
                        border
                        border-yellow-200
                        rounded-2xl
                        p-5
                    ">
                        <p className="font-semibold mb-2">
                            🔒 Réservé aux membres PRO
                        </p>

                        <p className="text-gray-600 text-sm">
                            Votre entreprise apparaîtra dans
                            l'annuaire SEO public et pourra
                            être trouvée par vos futurs clients.
                        </p>
                    </div>

                    {/* BUTTON */}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="
                            w-full
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            transition
                            disabled:opacity-50
                        "
                    >
                        {loading
                            ? "⏳ Publication..."
                            : "🚀 Publier ma fiche"}
                    </button>

                </div>

            </div>

        </div>
    );
}