import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../config";

export default function Pricing() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    const [plans, setPlans] = useState({});
    const [isYearly, setIsYearly] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(null);

    const [hasSubscription, setHasSubscription] = useState(false);
    const [userPlan, setUserPlan] = useState("FREE");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ========================= */
    /* 📡 LOAD */
    /* ========================= */
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                const token = localStorage.getItem("token");

                const [plansRes, userRes] = await Promise.all([
                    fetch(`${API_BASE}/plans`),
                    token
                        ? fetch(`${API_BASE}/auth/me`, {
                            headers: { Authorization: "Bearer " + token }
                        })
                        : null
                ]);

                const plansData = await plansRes.json();

                if (isMounted) {
                    setPlans(plansData || {});
                }

                if (userRes) {
                    const userData = await userRes.json();
                    console.log("USER DATA =", userData);

                    if (isMounted && userData?.plan) {
                        setUserPlan(userData.plan);
                        setHasSubscription(userData.plan !== "FREE");
                    }
                }
            } catch (err) {
                console.error("LOAD ERROR:", err);
                if (isMounted) setError("Erreur chargement");
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    /* ========================= */
    /* 💳 CHECKOUT */
    /* ========================= */
    const handleCheckout = async (planKey) => {
        if (loadingPlan) return;

        setLoadingPlan(planKey);

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate(`/${currentLang}/login`);
                return;
            }

            console.log("🚀 START CHECKOUT");
            console.log("🚀 PLAN:", planKey);
            console.log("🚀 YEARLY:", isYearly);
            console.log("🚀 API:", `${API_BASE}/stripe/checkout`);

            const res = await fetch(`${API_BASE}/stripe/checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    plan: planKey.toUpperCase(),
                    isYearly
                })
            });

            console.log("🚀 STATUS:", res.status);

            const data = await res.json().catch((err) => {
                console.error("❌ JSON ERROR:", err);
                return null;
            });

            console.log("🚀 RESPONSE DATA:", data);

            if (res.status === 401) {
                navigate(`/${currentLang}/login`);
                return;
            }

            if (res.status === 403) {
                console.log("⚠️ 403 RECEIVED");

                if (data?.redirectToPortal) {
                    return openPortal();
                }

                setError("Abonnement déjà actif");
                return;
            }

            if (!res.ok) {
                console.error("❌ REQUEST FAILED");
                console.error(data);

                setError(data?.error || "Erreur paiement");
                return;
            }

            if (!data?.url) {
                console.error("❌ NO URL RETURNED");
                console.error(data);

                setError("URL Stripe manquante");
                return;
            }

            console.log("✅ STRIPE URL:", data.url);
            console.log("✅ REDIRECT URL:", data.url);

            window.location.href = data.url;
        } catch (err) {
            console.error("❌ CHECKOUT ERROR:", err);
            setError(err.message || "Erreur paiement");
        } finally {
            setLoadingPlan(null);
        }
    };

    /* ========================= */
    /* 💳 PORTAL */
    /* ========================= */
    const openPortal = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate(`/${currentLang}/login`);
                return;
            }

            const res = await fetch(`${API_BASE}/stripe/portal`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + token
                }
            });

            const data = await res.json();

            if (!data?.url) {
                setError("Aucun abonnement actif");
                return;
            }

            window.location.href = data.url;
        } catch (err) {
            console.error(err);
            setError("Erreur portail");
        }
    };

    /* ========================= */
    /* 💰 HELPERS SAFE */
    /* ========================= */
    const getPrice = (plan) => {
        const base = Number(plan?.price) || 0;
        return isYearly ? Math.round(base * 12 * 0.8) : base;
    };

    const getSavings = (plan) => {
        const base = Number(plan?.price) || 0;
        return Math.round(base * 12 * 0.2);
    };

    /* ========================= */
    /* ⏳ LOADING */
    /* ========================= */
    if (loading) {
        return (
            <div className="p-10 text-center text-gray-500">
                ⏳ Chargement des offres...
            </div>
        );
    }

    /* ========================= */
    /* UI */
    /* ========================= */
    return (
        <div className="max-w-7xl mx-auto px-10 py-16">
            <h1 className="text-3xl font-bold mb-2 text-center">
                🚀 {t("pricingTitle")}
            </h1>

            <p className="text-gray-500 text-center mb-8">
                {t("pricingSubtitle")}
            </p>

            {error && (
                <p className="text-red-500 text-center mb-6">{error}</p>
            )}

            {/* TOGGLE */}
            <div className="flex justify-center items-center gap-4 mb-12">
                <span className={!isYearly ? "font-semibold" : "text-gray-400"}>
                    {t("monthly")}
                </span>

                <button
                    onClick={() => setIsYearly((v) => !v)}
                    className="w-14 h-7 bg-gray-200 rounded-full relative"
                >
                    <div
                        className={`w-6 h-6 bg-purple-600 rounded-full absolute top-0.5 transition ${isYearly ? "left-7" : "left-0.5"
                            }`}
                    />
                </button>

                <span className={isYearly ? "font-semibold" : "text-gray-400"}>
                    {t("yearly")}
                </span>

                {isYearly && (
                    <span className="text-green-600 text-sm font-medium">
                        -20%
                    </span>
                )}
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Object.entries(plans).map(([key, plan]) => {
                    const price = getPrice(plan);
                    const isPopular = key === "BUSINESS";
                    const isCurrent = userPlan === key;
                    const isUnlimited = plan.limit === null;

                    return (
                        <div
                            key={key}
                            className={`relative rounded-2xl p-8 transition hover:scale-105 bg-white
                            ${isPopular
                                    ? "border-2 border-purple-500 shadow-xl"
                                    : "border"
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-6 bg-purple-600 text-white text-xs px-4 py-1 rounded-full">
                                    🔥 Meilleur choix
                                </div>
                            )}

                            {isCurrent && (
                                <div className="absolute -top-3 right-6 bg-green-500 text-white text-xs px-4 py-1 rounded-full">
                                    Plan actuel
                                </div>
                            )}

                            <h2 className="text-xl font-semibold mb-2">
                                {plan.name || key}
                            </h2>

                            <div className="text-4xl font-bold mb-2">
                                {price}€
                                {isYearly && (
                                    <div className="text-sm text-gray-400 line-through">
                                        {(plan?.price || 0) * 12}€
                                    </div>
                                )}
                            </div>

                            {isYearly && (
                                <div className="text-green-600 text-sm mb-4">
                                    Économisez {getSavings(plan)}€
                                </div>
                            )}

                            <ul className="space-y-2 text-gray-600 mb-6 text-sm">
                                <li>
                                    {isUnlimited
                                        ? "✓ Illimité"
                                        : `✓ ${plan.limit} / mois`}
                                </li>

                                {plan.features?.map((f, i) => (
                                    <li key={i}>✓ {f}</li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleCheckout(key)}
                                disabled={
                                    isCurrent ||
                                    key === "FREE" ||
                                    loadingPlan === key
                                }
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
                            >
                                {isCurrent
                                    ? "Plan actuel"
                                    : loadingPlan === key
                                        ? "⏳ Chargement..."
                                        : key === "FREE"
                                            ? "Gratuit"
                                            : "Choisir"}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* PORTAL */}
            <div className="mt-12 text-center">
                {hasSubscription ? (
                    <button
                        onClick={openPortal}
                        className="bg-black text-white px-6 py-3 rounded-xl"
                    >
                        💳 Gérer mon abonnement
                    </button>
                ) : (
                    <p className="text-gray-400">Aucun abonnement actif</p>
                )}
            </div>
        </div>
    );
}