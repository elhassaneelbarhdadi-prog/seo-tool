import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {

    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /* ========================= */
    /* 🔒 REDIRECT SI CONNECTÉ */
    /* ========================= */
    useEffect(() => {
        const token = localStorage.getItem("token");

        // 🔥 important : uniquement sur /login
        if (token && window.location.pathname.includes("/login")) {
            navigate(`/${currentLang}/dashboard`);
        }
    }, [navigate, currentLang]);

    /* ========================= */
    /* 🔑 LOGIN */
    /* ========================= */
    const handleLogin = async (e) => {
        e.preventDefault();

        if (loading) return;

        setError("");
        setLoading(true);

        console.log("🚀 LOGIN START");

        try {
            const res = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            console.log("📡 RESPONSE STATUS:", res.status);

            const text = await res.text();
            console.log("📦 RAW RESPONSE:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                console.error("❌ JSON PARSE ERROR");
                throw new Error("Réponse serveur invalide");
            }

            console.log("✅ DATA:", data);
            console.log("TOKEN:", data.token);
            if (!res.ok) {
                throw new Error(data?.error || "Login failed");
            }

            if (!data?.token) {
                throw new Error("Token manquant");
            }

            localStorage.setItem("token", data.token);

            console.log("🎯 REDIRECT");

            navigate(`/${currentLang}/dashboard`);

        } catch (err) {
            console.error("❌ LOGIN ERROR:", err);
            setError(err.message);
        } finally {
            console.log("🛑 LOGIN END");
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white p-8 rounded-lg shadow-md w-96">

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {t("login")}
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">

                    <input
                        type="email"
                        placeholder={t("email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-3 rounded"
                        required
                    />

                    <input
                        type="password"
                        placeholder={t("password")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-3 rounded"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
                    >
                        {loading ? t("loading") : t("submit")}
                    </button>

                </form>

            </div>

        </div>
    );
}