import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import useApi from "../hooks/useApi";

/* COMPONENTS */
import SeoOverview from "../components/SeoOverview";
import KeywordHistory from "../components/KeywordHistory";
import KeywordChart from "../components/KeywordChart";
import KeywordSuggestions from "../components/KeywordSuggestions";
import SEOChat from "../components/SEOChat";
import EasyNiches from "../components/EasyNiches";
import ProductList from "../components/ProductList";
import SerpResults from "../components/SerpResults";
import UpgradeModal from "../components/UpgradeModal";

export default function KeywordAnalyzer() {
    const navigate = useNavigate();
    const { lang } = useParams();
    const location = useLocation();
    const api = useApi();

    const currentLang = lang || "fr";

    const resultRef = useRef(null);
    const inputRef = useRef(null);

    const [showUpgrade, setShowUpgrade] = useState(false);
    const [usage, setUsage] = useState(null);
    const [user, setUser] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ========================= */
    /* LIMIT CHECK */
    /* ========================= */
    const isFreeLimitReached =
        user?.plan === "FREE" &&
        usage?.limit &&
        usage?.used >= usage?.limit;

    /* ========================= */
    /* LOAD DATA */
    /* ========================= */
    const loadAllData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const [usageData, userData, historyData] = await Promise.all([
                api.get("/keyword/usage"),
                api.get("/auth/me"),
                api.get("/keyword/history")
            ]);

            setUsage(usageData || null);
            setUser(userData || null);
            setHistory(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            console.error("LOAD ERROR:", err);
        }
    }, [api]);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    /* ========================= */
    /* ANALYZE */
    /* ========================= */
    /* ========================= */
    /* ANALYZE */
    /* ========================= */
    const handleAnalyze = useCallback(async (input) => {

        const finalKeyword =
            typeof input === "string" ? input : keyword;

        if (!finalKeyword?.trim() || loading) return;

        if (isFreeLimitReached) {
            setShowUpgrade(true);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const cleanKeyword = finalKeyword.trim();

            // ✅ FIX ICI
            const data = await api.post("/seo/analyze", {
                keyword: cleanKeyword
            });

            if (!data || typeof data !== "object") {
                throw new Error("Invalid API response");
            }

            setResult({
                ...data,
                trend: Array.isArray(data?.trend) ? data.trend : []
            });

            setKeyword("");

            await loadAllData();

        } catch (err) {
            console.error("🔥 ANALYZE ERROR:", err);

            if (err?.status === 403 || err?.code === "LIMIT_REACHED") {
                setShowUpgrade(true);
                return;
            }

            setError("Erreur lors de l'analyse");

        } finally {
            setLoading(false);
        }

    }, [keyword, loading, isFreeLimitReached, api, loadAllData]);

    /* ========================= */
    /* AUTO KEYWORD */
    /* ========================= */
    useEffect(() => {
        const autoKeyword =
            location.state?.autoKeyword || location.state?.keyword;

        if (autoKeyword && autoKeyword !== keyword && !loading) {
            setKeyword(autoKeyword);
            handleAnalyze(autoKeyword);
            window.history.replaceState({}, document.title);
        }
    }, [location, keyword, loading, handleAnalyze]);

    /* ========================= */
    /* AUTO FOCUS */
    /* ========================= */
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [location]);

    /* ========================= */
    /* SCROLL RESULT */
    /* ========================= */
    useEffect(() => {
        if (result) {
            resultRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [result]);

    /* ========================= */
    /* DELETE HISTORY */
    /* ========================= */
    const deleteKeyword = async (id) => {
        try {
            await api.del(`/keyword/${id}`);
            await loadAllData();
        } catch (err) {
            console.error("DELETE ERROR:", err);
        }
    };

    /* ========================= */
    /* UI */
    /* ========================= */
    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* HERO */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl">

                <h1 className="text-3xl font-bold mb-2">
                    🚀 Transformez un mot-clé en business rentable
                </h1>

                <p className="text-indigo-100 mb-6">
                    Trouvez une niche, validez son potentiel et générez du trafic gratuitement avec Google.
                </p>

                <div className="flex flex-col md:flex-row gap-4">

                    <input
                        ref={inputRef}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Ex: réparation vélo, coach boxe, plombier paris..."
                        className="flex-1 p-4 rounded-xl text-black"
                    />

                    <button
                        onClick={() => handleAnalyze()}
                        disabled={loading || !keyword.trim()}
                        className="bg-black px-6 py-4 rounded-xl disabled:opacity-50"
                    >
                        {loading
                            ? "Analyse en cours..."
                            : isFreeLimitReached
                                ? "🚀 Upgrade"
                                : "🚀 Trouver une opportunité rentable"}
                    </button>

                </div>

                {usage && user?.plan === "FREE" && (
                    <p className="text-center text-sm text-indigo-200 mt-4">
                        {usage.used} / {usage.limit} analyses utilisées
                    </p>
                )}

            </div>

            {error && (
                <p className="text-red-500 text-center">{error}</p>
            )}

            {result && (
                <div ref={resultRef} className="space-y-6">

                    {result?.landing && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    navigate(
                                        `/${currentLang}/landing/${encodeURIComponent(result.keyword)}`
                                    );
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl shadow"
                            >
                                🚀 Créer ce business
                            </button>
                        </div>
                    )}

                    <SeoOverview result={result} />
                    <KeywordChart result={result} />
                    <ProductList products={result?.products || []} />
                    <SerpResults serp={result?.serp || []} />
                    <SEOChat result={result} />

                    <EasyNiches
                        result={result}
                        onSelect={(kw) => handleAnalyze(kw)}
                    />

                    <KeywordSuggestions
                        suggestions={result?.suggestions || []}
                        onSelect={(kw) => handleAnalyze(kw)}
                    />

                </div>
            )}

            <KeywordHistory
                history={history}
                deleteKeyword={deleteKeyword}
                onSelect={(kw) => handleAnalyze(kw)}
            />

            <UpgradeModal
                isOpen={showUpgrade}
                onClose={() => setShowUpgrade(false)}
            />

        </div>
    );
}