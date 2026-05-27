import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { request, API } from "../services/api";

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

    /* ========================= */
    /* INPUT */
    /* ========================= */
    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    /* ========================= */
    /* VALIDATION */
    /* ========================= */
    const isValid = () => {
        return (
            form.name.trim() &&
            form.keyword.trim() &&
            form.city.trim()
        );
    };

    /* ========================= */
    /* NAV */
    /* ========================= */
    const goAnnuaire = () =>
        navigate(`/${currentLang}/dashboard/annuaire`);

    /* ========================= */
    /* SUBMIT */
    /* ========================= */
    const handleSubmit = async () => {

        setError("");
        setSuccess("");

        if (!isValid()) {
            setError("Veuillez remplir tous les champs");
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

            /* ========================= */
            /* CAS EXIST */
            /* ========================= */
            if (data?.alreadyExists) {
                setError("⚠️ Vous avez déjà un profil");
                setTimeout(goAnnuaire, 1500);
                return;
            }

            /* ========================= */
            /* SUCCESS */
            /* ========================= */
            setSuccess("✅ Profil créé avec succès");

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

            setError(err.message || "❌ Erreur serveur");

        } finally {
            setLoading(false);
        }
    };

    /* ========================= */
    /* UI */
    /* ========================= */
    return (

        <div className="max-w-3xl mx-auto p-6">

            <div className="text-center mb-10">

                <h1 className="
        text-4xl
        font-black
        mb-3
    ">
                    🚀 Référencez votre entreprise
                    dans l’annuaire SEO
                </h1>

                <p className="
        text-gray-500
        text-lg
    ">
                    Apparaissez dans notre annuaire SEO
                    et gagnez en visibilité sur Google.
                </p>

            </div>

            {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 text-green-600 p-3 rounded mb-4">
                    {success}
                </div>
            )}

            <div className="space-y-4">

                <input
                    name="name"
                    placeholder="Nom de l'entreprise"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                />

                <input
                    name="keyword"
                    placeholder="Mot-clé principal"
                    value={form.keyword}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                />

                <input
                    name="city"
                    placeholder="Ville"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                />

                <textarea
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full border p-3 rounded"
                />

                <div className="bg-yellow-100 p-3 rounded text-sm text-center">
                    🔒 Réservé aux utilisateurs PRO pour apparaître dans l'annuaire
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded disabled:opacity-50"
                >
                    {loading ? "⏳ Envoi..." : "🚀 Publier"}
                </button>

            </div>

        </div>
    );
}