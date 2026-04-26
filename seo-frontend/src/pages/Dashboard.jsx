import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import UsageBar from "../components/UsageBar";

export default function Dashboard() {

    const navigate = useNavigate();
    const { lang } = useParams();
    const { t, i18n } = useTranslation();

    const currentLang = lang || "fr";
    const isDev = import.meta.env.DEV;

    const api = useApi();

    const [plans, setPlans] = useState({});
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ========================= */
    /* 🌍 SYNC LANG */
    /* ========================= */
    useEffect(() => {
        if (lang && !i18n.language.startsWith(lang)) {
            i18n.changeLanguage(lang);
            localStorage.setItem("lang", lang);
        }
    }, [lang, i18n]);

    /* ========================= */
    /* 🔄 CHANGE LANG */
    /* ========================= */
    const changeLang = (newLang) => {
        localStorage.setItem("lang", newLang);
        navigate(`/${newLang}/dashboard`);
    };

    /* ========================= */
    /* 📡 LOAD USAGE (FIX CLEAN) */
    /* ========================= */
    const loadUsage = useCallback(async () => {
        try {
            const data = await api.get("/keyword/usage");

            if (!data) return;

            setUsage({
                used: data.used || 0,
                limit: data.limit ?? Infinity,
                plan: data.plan || "FREE"
            });

        } catch (err) {
            console.error("USAGE ERROR:", err);

            // fallback safe
            setUsage({
                used: 0,
                limit: 5,
                plan: "FREE"
            });
        }
    }, [api]);

    /* ========================= */
    /* 🔥 RESET USAGE */
    /* ========================= */
    const resetUsage = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch("http://localhost:3001/api/dev/reset-usage", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            if (!res.ok) throw new Error("Reset failed");

            await loadUsage();

            alert("✅ Usage reset");

        } catch (err) {
            console.error(err);
            alert("Erreur reset");
        }
    };

    /* ========================= */
    /* 📡 LOAD DATA */
    /* ========================= */
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const plansRes = await fetch("http://localhost:3001/api/plans");
                const plansData = await plansRes.json();
                setPlans(plansData);

                await loadUsage();

            } catch (error) {
                console.error("DASHBOARD ERROR:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentLang, loadUsage]);

    /* ========================= */
    /* ⏳ LOADING */
    /* ========================= */
    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500">
                {t("loading")}
            </div>
        );
    }

    /* ========================= */
    /* 📊 DATA */
    /* ========================= */
    const currentPlan = usage?.plan || "FREE";
    const used = usage?.used || 0;
    const limit = usage?.limit ?? 5;

    const isUnlimited = limit === Infinity;
    const isLimitReached = !isUnlimited && used >= limit;

    /* ========================= */
    /* 🎨 UI */
    /* ========================= */
    return (
        <div className="max-w-5xl mx-auto p-6">

            {/* 🌍 LANG */}
            <div className="flex justify-end mb-4">
                <select
                    onChange={(e) => changeLang(e.target.value)}
                    value={currentLang}
                    className="border px-2 py-1 rounded"
                >
                    <option value="fr">🇫🇷 FR</option>
                    <option value="en">🇬🇧 EN</option>
                    <option value="es">🇪🇸 ES</option>
                    <option value="de">🇩🇪 DE</option>
                </select>
            </div>

            <h1 className="text-3xl font-bold mb-6">
                {t("dashboard")}
            </h1>

            <div className="bg-white shadow rounded-xl p-6 mb-6">

                <h2 className="font-bold text-lg mb-2">
                    {t("currentPlan")} : {t(`plan_${currentPlan}`)}
                </h2>

                <p className="text-gray-600 mb-4">
                    {used} / {isUnlimited ? "∞" : limit} recherches utilisées
                </p>

                <UsageBar used={used} limit={limit} />

                {isLimitReached && (
                    <div className="mt-3 text-red-600 text-sm font-semibold">
                        🚫 Limite atteinte — passe au plan supérieur
                    </div>
                )}

                {isLimitReached && (
                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard/pricing`)}
                        className="mt-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded"
                    >
                        🚀 Upgrade maintenant
                    </button>
                )}

                <ul className="space-y-2 text-sm text-gray-700 mt-4">
                    {plans[currentPlan]?.features?.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            {t(f)}
                        </li>
                    ))}
                </ul>

            </div>

            {isDev && (
                <button
                    onClick={resetUsage}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                    🔄 Reset usage (DEV)
                </button>
            )}

            {!usage && (
                <p className="text-red-500 text-sm mt-4">
                    ⚠️ {t("serverError")}
                </p>
            )}

        </div>
    );
}