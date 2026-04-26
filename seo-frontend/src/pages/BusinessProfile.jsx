import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useApi from "../hooks/useApi";

export default function BusinessProfile() {

    const api = useApi();
    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    const [form, setForm] = useState({
        name: "",
        keyword: "",
        city: "",
        description: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ========================= */
    /* SAFE GUARD */
    /* ========================= */
    if (!api) {
        return (
            <div style={{ padding: 40 }}>
                ⚠️ API non disponible
            </div>
        );
    }

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    /* ========================= */
    /* SUBMIT */
    /* ========================= */
    const handleSubmit = async () => {

        setError("");

        if (!form.name || !form.keyword || !form.city) {
            setError("Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);

        try {

            const res = await api.post("/business-profile", form);

            // 🔥 CAS : déjà existant
            if (res?.alreadyExists) {
                alert("Tu as déjà un profil 👀");
                navigate(`/${currentLang}/dashboard/annuaire`);
                return;
            }

            // 🔥 sécurité API
            if (!res || res.error) {
                throw new Error(res?.error || "API ERROR");
            }

            alert("Profil créé avec succès 🚀");

            navigate(`/${currentLang}/dashboard/annuaire`);

        } catch (err) {

            console.error("CREATE PROFILE ERROR:", err);

            // 🔥 CAS : FREE → upgrade
            if (
                err?.status === 403 ||
                err?.message?.includes("upgradeRequired")
            ) {
                navigate(`/${currentLang}/pricing`);
                return;
            }

            setError("Erreur serveur ou API indisponible");

        } finally {
            setLoading(false);
        }
    };
    /* ========================= */
    /* UI */
    /* ========================= */
    return (

        <div className="max-w-3xl mx-auto p-6">

            <h1 className="text-3xl font-bold mb-4">
                🚀 Ajouter mon entreprise
            </h1>

            {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                    {error}
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
                <div className="bg-yellow-100 p-3 rounded mb-4 text-sm text-center">
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