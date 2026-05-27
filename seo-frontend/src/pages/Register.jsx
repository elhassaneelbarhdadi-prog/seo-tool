import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Register() {

    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /* ========================= */
    /* 🔄 CHANGE */
    /* ========================= */
    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    /* ========================= */
    /* 🔒 VALIDATION */
    /* ========================= */
    const validate = () => {

        const email = form.email.trim();
        const password = form.password.trim();

        if (!email || !password) {
            return "Veuillez remplir tous les champs";
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return "Email invalide";
        }

        if (password.length < 6) {
            return "Mot de passe trop court (6+)";
        }

        return null;
    };

    /* ========================= */
    /* 🚀 REGISTER */
    /* ========================= */
    const handleRegister = async (e) => {

        e.preventDefault();

        if (loading) return;

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        setError("");
        setLoading(true);

        try {

            const res = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: form.email.trim(),
                    password: form.password.trim()
                })
            });

            let data = null;

            try {
                data = await res.json();
            } catch {
                throw new Error("Réponse serveur invalide");
            }

            if (!res.ok) {
                throw new Error(
                    data?.error
                        ? t(data.error)
                        : t("registerError")
                );
            }

            if (!data?.token) {
                throw new Error("Token manquant");
            }

            /* ========================= */
            /* 🔐 SAVE */
            /* ========================= */
            localStorage.setItem("token", data.token);

            /* ========================= */
            /* 🎯 REDIRECT */
            /* ========================= */
            navigate(`/${currentLang}/dashboard`);

        } catch (err) {

            console.error("REGISTER ERROR:", err);
            setError(err.message || t("serverError"));

        } finally {
            setLoading(false);
        }
    };

    /* ========================= */
    /* UI */
    /* ========================= */
    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-8 rounded-lg shadow-md w-96">

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {t("register")}
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">

                    <input
                        type="email"
                        name="email"
                        placeholder={t("email")}
                        value={form.email}
                        onChange={handleChange}
                        className="border p-3 rounded"
                        disabled={loading}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder={t("password")}
                        value={form.password}
                        onChange={handleChange}
                        className="border p-3 rounded"
                        disabled={loading}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? "⏳ Création..." : t("register")}
                    </button>

                </form>

                {/* LOGIN */}
                <p className="text-sm text-gray-500 mt-4 text-center">
                    {t("alreadyAccount")}{" "}
                    <span
                        onClick={() => navigate(`/${currentLang}/login`)}
                        className="text-blue-600 cursor-pointer"
                    >
                        {t("login")}
                    </span>
                </p>

            </div>

        </div>
    );
}