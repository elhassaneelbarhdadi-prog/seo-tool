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

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {

        e.preventDefault();
        setError("");
        setLoading(true);

        try {

            const res = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(t(data.error) || t("registerError"));
                setLoading(false);
                return;
            }

            // auto login
            localStorage.setItem("token", data.token);

            // 🔥 REDIRECT AVEC LANG
            navigate(`/${currentLang}/dashboard`);

        } catch (err) {
            console.error(err);
            setError(t("serverError"));
        }

        setLoading(false);
    };

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
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder={t("password")}
                        value={form.password}
                        onChange={handleChange}
                        className="border p-3 rounded"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
                    >
                        {loading ? t("loading") : t("register")}
                    </button>

                </form>

                {/* 🔥 LOGIN LINK */}
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