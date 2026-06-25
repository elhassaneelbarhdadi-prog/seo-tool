import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";

import KpiCards from "../components/KpiCards";
import SeoGauge from "../components/SeoGauge";
import IntentChart from "../components/IntentChart";
import SeoIdeas from "../components/SeoIdeas";
import SeoOverview from "../components/SeoOverview";
import KeywordHistory from "../components/KeywordHistory";
import KeywordChart from "../components/KeywordChart";
import KeywordSuggestions from "../components/KeywordSuggestions";
import SEOChat from "../components/SEOChat";
import EasyNiches from "../components/EasyNiches";
import SerpResults from "../components/SerpResults";
import UpgradeModal from "../components/UpgradeModal";

import {
    analyzeKeyword,
    analyzeKeywordFree,
    getKeywordHistory,
    getKeywordUsage,
    getMe,
    deleteKeyword as apiDeleteKeyword,
    deleteAllKeywords as apiDeleteAllKeywords
} from "../services/api";

import { API_BASE } from "../config";
import { formatNumber } from "../utils/format";

console.log("🔥 KEYWORD ANALYZER BUILD V5 GUEST PERSIST");

/* ========================= */
/* GUEST MODE */
/* ========================= */

const GUEST_LIMIT = 5;
const GUEST_ID_KEY = "guest_id";
const GUEST_USAGE_KEY = "guest_free_usage";

/* ========================= */
/* GUEST HELPERS */
/* ========================= */

function generateGuestId() {
    return (
        "guest_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2, 10)
    );
}

function getGuestId() {
    try {
        let guestId = localStorage.getItem(GUEST_ID_KEY);

        if (!guestId) {
            guestId = generateGuestId();
            localStorage.setItem(GUEST_ID_KEY, guestId);
        }

        return guestId;
    } catch {
        return generateGuestId();
    }
}

function getGuestUsageLocal() {
    try {
        const raw = localStorage.getItem(GUEST_USAGE_KEY);
        const value = JSON.parse(raw || "{}");

        return {
            used: Number(value.used || 0),
            remaining: Number(
                value.remaining ?? GUEST_LIMIT
            ),
            limit: Number(value.limit || GUEST_LIMIT)
        };
    } catch {
        return {
            used: 0,
            remaining: GUEST_LIMIT,
            limit: GUEST_LIMIT
        };
    }
}

function setGuestUsageLocal(payload) {
    try {
        localStorage.setItem(
            GUEST_USAGE_KEY,
            JSON.stringify({
                used: Number(payload?.used || 0),
                remaining: Number(
                    payload?.remaining ?? 0
                ),
                limit: Number(
                    payload?.limit || GUEST_LIMIT
                )
            })
        );
    } catch {
        // ignore
    }
}

export default function KeywordAnalyzer() {
    const location = useLocation();

    const resultRef = useRef(null);
    const inputRef = useRef(null);
    const autoRunRef = useRef(false);

    const queryClient = useQueryClient();

    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    const [showUpgrade, setShowUpgrade] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [result, setResult] = useState(null);
    const [organicResults, setOrganicResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [guestId] = useState(() =>
        isLoggedIn ? null : getGuestId()
    );

    const [guestUsage, setGuestUsage] = useState(() =>
        isLoggedIn
            ? {
                used: 0,
                remaining: GUEST_LIMIT,
                limit: GUEST_LIMIT
            }
            : getGuestUsageLocal()
    );

    /* ========================= */
    /* QUERIES (ONLY LOGGED IN) */
    /* ========================= */

    const { data: usage } = useQuery({
        queryKey: ["usage"],
        queryFn: getKeywordUsage,
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
        enabled: isLoggedIn
    });

    const { data: history = [] } = useQuery({
        queryKey: ["history"],
        queryFn: getKeywordHistory,
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
        enabled: isLoggedIn
    });

    const { data: user } = useQuery({
        queryKey: ["user"],
        queryFn: getMe,
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
        enabled: isLoggedIn
    });

    const isUnlimited = usage?.limit === null;

    const hasHistory =
        isLoggedIn &&
        Array.isArray(history) &&
        history.length > 0;

    const guestUsed = Number(guestUsage?.used || 0);
    const guestRemaining = Number(
        guestUsage?.remaining ?? GUEST_LIMIT
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setGuestUsage(getGuestUsageLocal());
        }
    }, [isLoggedIn]);

    const handleAnalyze = useCallback(
        async (input) => {
            const finalKeyword =
                typeof input === "string"
                    ? input
                    : keyword;

            if (!finalKeyword?.trim() || loading) {
                return;
            }

            const cleanKeyword = finalKeyword.trim();

            /* ========================= */
            /* GUEST LIMIT (UI PRECHECK) */
            /* ========================= */

            if (!isLoggedIn && guestRemaining <= 0) {
                setError(
                    "Vous avez utilisé vos 5 analyses gratuites. Créez un compte pour continuer."
                );
                setShowUpgrade(true);
                return;
            }

            /* ========================= */
            /* LOGGED USER LIMIT */
            /* ========================= */

            if (
                isLoggedIn &&
                usage &&
                usage.limit !== null &&
                usage.used >= usage.limit
            ) {
                setShowUpgrade(true);
                return;
            }

            setLoading(true);
            setError("");

            try {
                let data = null;

                /* ========================= */
                /* ANALYZE */
                /* ========================= */

                if (isLoggedIn) {
                    data = await analyzeKeyword(cleanKeyword);
                } else {
                    data = await analyzeKeywordFree(
                        cleanKeyword,
                        guestId
                    );

                    if (data?.guest) {
                        setGuestUsage(data.guest);
                        setGuestUsageLocal(data.guest);
                    }
                }

                /* ========================= */
                /* GOOGLE ORGANIC */
                /* ========================= */

                try {
                    const organicResponse = await fetch(
                        `${API_BASE}/seo/organic?keyword=${encodeURIComponent(cleanKeyword)}`
                    );

                    let organicData = null;

                    try {
                        organicData =
                            await organicResponse.json();
                    } catch {
                        throw new Error(
                            "Réponse organic invalide"
                        );
                    }

                    if (!organicResponse.ok) {
                        throw new Error(
                            organicData?.error ||
                            `HTTP ${organicResponse.status}`
                        );
                    }

                    setOrganicResults(
                        organicData.organic || []
                    );
                } catch (err) {
                    console.error(
                        "ORGANIC ERROR:",
                        err
                    );
                    setOrganicResults([]);
                }

                setResult(data);
                setKeyword("");

                /* ========================= */
                /* REFRESH LOGGED USER ONLY */
                /* ========================= */

                if (isLoggedIn) {
                    await Promise.all([
                        queryClient.invalidateQueries({
                            queryKey: ["usage"]
                        }),
                        queryClient.invalidateQueries({
                            queryKey: ["history"]
                        })
                    ]);
                }
            } catch (err) {
                console.error("ANALYZE ERROR:", err);

                if (!isLoggedIn) {
                    if (err?.data?.used !== undefined) {
                        const payload = {
                            used: Number(err.data.used || GUEST_LIMIT),
                            remaining: Number(err.data.remaining || 0),
                            limit: Number(err.data.limit || GUEST_LIMIT)
                        };

                        setGuestUsage(payload);
                        setGuestUsageLocal(payload);
                    }

                    if (
                        err?.data?.error === "FREE_LIMIT_REACHED" ||
                        err?.status === 403
                    ) {
                        setShowUpgrade(true);
                        setError(
                            "Vous avez utilisé vos 5 analyses gratuites. Créez un compte pour continuer."
                        );
                        return;
                    }
                }

                if (
                    !isLoggedIn &&
                    err?.data?.error === "GUEST_ID_REQUIRED"
                ) {
                    setError(
                        "Erreur de session invité. Rechargez la page."
                    );
                    return;
                }

                setError(
                    err?.message ||
                    "Erreur lors de l'analyse"
                );
            } finally {
                setLoading(false);
            }
        },
        [
            keyword,
            loading,
            usage,
            queryClient,
            isLoggedIn,
            guestRemaining,
            guestId
        ]
    );

    useEffect(() => {
        if (autoRunRef.current) {
            return;
        }

        const autoKeyword =
            location.state?.autoKeyword ||
            location.state?.keyword;

        if (autoKeyword && !loading) {
            autoRunRef.current = true;
            handleAnalyze(autoKeyword);
        }
    }, [location, loading, handleAnalyze]);

    useEffect(() => {
        if (!result) {
            return;
        }

        resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, [result]);

    const handleDeleteKeyword = async (id) => {
        if (!isLoggedIn) return;

        try {
            await apiDeleteKeyword(id);

            queryClient.setQueryData(
                ["history"],
                (old = []) =>
                    old.filter(
                        (item) => item.id !== id
                    )
            );
        } catch (err) {
            console.error("DELETE ERROR:", err);
        }
    };

    const handleDeleteAll = async () => {
        if (!isLoggedIn) return;

        const confirmed = window.confirm(
            "Supprimer tout l'historique ?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await apiDeleteAllKeywords();

            queryClient.setQueryData(["history"], []);

            await queryClient.invalidateQueries({
                queryKey: ["usage"]
            });
        } catch (err) {
            console.error("DELETE ALL ERROR:", err);
        }
    };

    return (
        <>
            <Helmet>
                <title>
                    Analyse SEO IA | SEO Tool
                </title>

                <meta
                    name="description"
                    content="Analysez vos mots-clés SEO avec IA, trafic, CPC, concurrence et intentions de recherche."
                />
            </Helmet>

            <div
                className="
                space-y-8
                w-full
                max-w-[1400px]
                mx-auto
                text-sm
                px-4
                pb-10
            "
            >
                {/* HEADER */}
                <div
                    className="
                    bg-gradient-to-r
                    from-indigo-600
                    to-purple-600
                    text-white
                    p-6
                    rounded-3xl
                    shadow-xl
                    border
                    border-white/10
                    overflow-hidden
                "
                >
                    <h1
                        className="
                        text-2xl
                        lg:text-3xl
                        font-bold
                        mb-3
                    "
                    >
                        🚀 Trouvez une opportunité SEO rentable
                    </h1>

                    <p
                        className="
                        text-indigo-100
                        mb-6
                        max-w-2xl
                    "
                    >
                        Analysez vos mots-clés avec IA,
                        découvrez le trafic potentiel,
                        les intentions de recherche,
                        la concurrence SEO et les
                        meilleures opportunités.
                    </p>

                    {/* GUEST BANNER */}
                    {!isLoggedIn && (
                        <div
                            className="
                            mb-5
                            rounded-2xl
                            bg-white/15
                            border
                            border-white/20
                            px-4
                            py-3
                            text-sm
                            backdrop-blur
                        "
                        >
                            🎁 Mode découverte :{" "}
                            <strong>
                                {guestRemaining} analyse(s)
                                gratuite(s)
                            </strong>{" "}
                            restante(s) sans compte.
                        </div>
                    )}

                    <div
                        className="
                        flex
                        flex-col
                        md:flex-row
                        gap-3
                    "
                    >
                        <input
                            ref={inputRef}
                            value={keyword}
                            onChange={(e) =>
                                setKeyword(e.target.value)
                            }
                            placeholder="Choisir un mot-clé..."
                            className="
                                flex-1
                                h-12
                                px-5
                                rounded-2xl
                                text-sm
                                text-black
                                outline-none
                                min-w-0
                                border
                                border-white/20
                                focus:ring-4
                                focus:ring-indigo-300
                                shadow-lg
                            "
                        />

                        <button
                            onClick={() => handleAnalyze()}
                            disabled={
                                loading ||
                                !keyword.trim()
                            }
                            className="
                                h-12
                                px-6
                                rounded-2xl
                                text-sm
                                font-semibold
                                bg-white
                                text-indigo-700
                                hover:bg-indigo-50
                                hover:scale-105
                                transition-all
                                duration-300
                                shadow-lg
                                disabled:opacity-50
                                shrink-0
                            "
                        >
                            {loading
                                ? "⏳ Analyse..."
                                : "🚀 Analyser"}
                        </button>
                    </div>

                    {/* LOGGED PLAN COUNTER */}
                    {isLoggedIn &&
                        usage &&
                        user?.plan === "FREE" && (
                            <p
                                className="
                                text-center
                                text-xs
                                mt-4
                                opacity-90
                            "
                            >
                                {formatNumber(usage.used)} /{" "}
                                {isUnlimited
                                    ? "∞"
                                    : formatNumber(
                                        usage.limit
                                    )}
                            </p>
                        )}

                    {/* GUEST COUNTER */}
                    {!isLoggedIn && (
                        <p
                            className="
                            text-center
                            text-xs
                            mt-4
                            opacity-90
                        "
                        >
                            {guestUsed} / {GUEST_LIMIT} essais gratuits utilisés
                        </p>
                    )}
                </div>

                {/* ERROR */}
                {error && (
                    <div
                        className="
                        bg-red-100
                        border
                        border-red-200
                        text-red-600
                        p-4
                        rounded-3xl
                        text-sm
                    "
                    >
                        {error}
                    </div>
                )}

                {/* RESULT */}
                {result && (
                    <div
                        ref={resultRef}
                        className="
                            space-y-8
                            w-full
                        "
                    >
                        <div
                            className={`
                                rounded-3xl
                                p-6
                                text-white
                                shadow-xl
                                transition-all
                                duration-300
                                ${result.verdict === "GO"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                                    : result.verdict === "WAIT"
                                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                        : "bg-gradient-to-r from-red-500 to-pink-600"
                                }
                            `}
                        >
                            <h3
                                className="
                                text-lg
                                font-bold
                                mb-3
                            "
                            >
                                🔥 Verdict SEO
                            </h3>

                            <div
                                className="
                                flex
                                justify-between
                                items-center
                                gap-4
                            "
                            >
                                <p
                                    className="
                                    text-4xl
                                    font-bold
                                "
                                >
                                    {result.scoreFinal}/100
                                </p>

                                <p
                                    className="
                                    text-xl
                                    font-bold
                                    whitespace-nowrap
                                "
                                >
                                    {result.verdict === "GO" && "🚀 GO"}
                                    {result.verdict === "WAIT" && "⚠️ WAIT"}
                                    {result.verdict === "NO_GO" && "❌ NO GO"}
                                </p>
                            </div>
                        </div>

                        <KpiCards result={result} />
                        <SeoOverview result={result} />

                        <div
                            className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-6
                        "
                        >
                            <div className="min-w-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <KeywordChart result={result} />
                            </div>

                            <div className="min-w-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <SeoGauge value={result.competition} />
                            </div>
                        </div>

                        <div
                            className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-6
                        "
                        >
                            <div className="min-w-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <div className="space-y-4">
                                    <SerpResults serp={result.serp} />

                                    {organicResults.length > 0 && (
                                        <div className="mt-6 space-y-4">
                                            <h3 className="text-lg font-bold">
                                                🔎 Résultats Google réels
                                            </h3>

                                            {organicResults.map((item) => (
                                                <div
                                                    key={item.position}
                                                    className="border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300"
                                                >
                                                    <p className="text-xs text-gray-400 mb-1">
                                                        Position #{item.position}
                                                    </p>

                                                    <a
                                                        href={item.link}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 font-semibold hover:underline break-all"
                                                    >
                                                        {item.title}
                                                    </a>

                                                    <p className="text-xs text-green-600 mt-1 break-all">
                                                        {item.link}
                                                    </p>

                                                    <p className="text-sm text-gray-600 mt-3">
                                                        {item.snippet}
                                                    </p>

                                                    {item.rating && (
                                                        <div className="flex gap-3 mt-3 text-sm">
                                                            <span>
                                                                ⭐ {item.rating}
                                                            </span>
                                                            <span>
                                                                👥 {item.ratingCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <IntentChart intents={result.intents} />
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                            <SeoIdeas ideas={result.ideas || []} />
                        </div>

                        {/* SEO CHAT = uniquement connecté */}
                        {isLoggedIn && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <SEOChat result={result} />
                            </div>
                        )}

                        {/* NICHES = uniquement connecté */}
                        {isLoggedIn && (
                            <div className="overflow-hidden w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                                <EasyNiches
                                    result={result}
                                    onSelect={handleAnalyze}
                                />
                            </div>
                        )}

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 transition-all duration-300 hover:shadow-xl">
                            <KeywordSuggestions
                                suggestions={result.suggestions}
                                onSelect={handleAnalyze}
                            />
                        </div>
                    </div>
                )}

                {/* HISTORY = connecté seulement */}
                {hasHistory && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button
                                onClick={handleDeleteAll}
                                className="bg-red-500 hover:bg-red-600 transition-all duration-300 text-white px-4 py-2 rounded-2xl text-sm shadow-lg"
                            >
                                🗑 Reset historique
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
                            <KeywordHistory
                                history={history}
                                deleteKeyword={handleDeleteKeyword}
                                onSelect={handleAnalyze}
                            />
                        </div>
                    </div>
                )}

                {/* CTA guest */}
                {!isLoggedIn && result && guestRemaining <= 2 && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold mb-2">
                            Sauvegardez vos analyses et débloquez toutes les fonctionnalités
                        </h3>

                        <p className="text-indigo-100 mb-4">
                            Il vous reste {guestRemaining} essai(s) gratuit(s). Créez un compte
                            pour accéder à l’historique, au dashboard complet et aux outils premium.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="/fr/register"
                                className="bg-white text-indigo-700 px-5 py-3 rounded-2xl font-semibold"
                            >
                                Créer un compte
                            </a>

                            <a
                                href="/fr/login"
                                className="border border-white/30 px-5 py-3 rounded-2xl font-semibold"
                            >
                                Se connecter
                            </a>
                        </div>
                    </div>
                )}

                <UpgradeModal
                    isOpen={showUpgrade}
                    onClose={() => setShowUpgrade(false)}
                />
            </div>
        </>
    );
}