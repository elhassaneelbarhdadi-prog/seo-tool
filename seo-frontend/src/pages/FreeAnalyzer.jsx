import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { analyzeKeywordFree } from "../services/api";

const FREE_LIMIT = 5;

export default function FreeAnalyzer() {
    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    const [keyword, setKeyword] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const used = useMemo(() => {
        return Number(
            localStorage.getItem("free_search_count") || 0
        );
    }, [result]);

    const remaining = Math.max(0, FREE_LIMIT - used);
    const limitReached = used >= FREE_LIMIT;

    const handleAnalyze = async () => {
        const cleanKeyword = keyword.trim();

        if (!cleanKeyword || loading) {
            return;
        }

        if (limitReached) {
            setError(
                "Vous avez utilisé vos 5 analyses gratuites. Créez un compte gratuit pour continuer."
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await analyzeKeywordFree(cleanKeyword);

            setResult(data);

            const nextUsed = Math.min(FREE_LIMIT, used + 1);

            localStorage.setItem(
                "free_search_count",
                String(nextUsed)
            );
        } catch (err) {
            console.error("FREE ANALYZE ERROR:", err);

            if (
                err?.message === "FREE_LIMIT_REACHED" ||
                err?.data?.error === "FREE_LIMIT_REACHED" ||
                err?.status === 429
            ) {
                localStorage.setItem(
                    "free_search_count",
                    String(FREE_LIMIT)
                );

                setError(
                    "Vous avez atteint la limite de 5 analyses gratuites. Créez un compte pour débloquer votre dashboard et continuer."
                );
            } else {
                setError(
                    err.message || "Erreur analyse"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* HERO */}
            <section
                className="
                bg-gradient-to-r
                from-indigo-600
                via-blue-600
                to-purple-600
                text-white
                py-24
                px-6
            "
            >
                <div className="max-w-6xl mx-auto text-center">
                    <div
                        className="
                        inline-flex
                        items-center
                        bg-white/20
                        backdrop-blur
                        px-5
                        py-2
                        rounded-full
                        mb-6
                        font-semibold
                    "
                    >
                        ✨ 5 analyses SEO gratuites sans inscription
                    </div>

                    <h1
                        className="
                        text-5xl
                        md:text-7xl
                        font-black
                        mb-6
                        leading-tight
                    "
                    >
                        Trouvez des mots-clés SEO
                        <br />
                        rentables en quelques secondes
                    </h1>

                    <p
                        className="
                        text-xl
                        text-indigo-100
                        max-w-3xl
                        mx-auto
                        mb-10
                    "
                    >
                        Analysez gratuitement le volume,
                        la concurrence et le potentiel business
                        de vos mots-clés avant vos concurrents.
                    </p>

                    <div
                        className="
                        flex
                        flex-col
                        md:flex-row
                        justify-center
                        gap-4
                    "
                    >
                        <button
                            onClick={() =>
                                document
                                    .getElementById("analyzer")
                                    ?.scrollIntoView({
                                        behavior: "smooth"
                                    })
                            }
                            className="
                            bg-white
                            text-indigo-600
                            px-8
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            hover:scale-105
                            transition
                        "
                        >
                            🚀 Analyser gratuitement
                        </button>

                        <button
                            onClick={() =>
                                navigate(`/${lang}/register`)
                            }
                            className="
                            border-2
                            border-white
                            px-8
                            py-4
                            rounded-2xl
                            font-bold
                            text-lg
                            hover:bg-white
                            hover:text-indigo-600
                            transition
                        "
                        >
                            Créer un compte
                        </button>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="max-w-6xl mx-auto px-6 -mt-12">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-5xl mb-3">📈</div>
                        <h3 className="text-3xl font-black">+1000</h3>
                        <p className="text-gray-500">
                            Analyses réalisées
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-5xl mb-3">⚡</div>
                        <h3 className="text-3xl font-black">&lt; 5 sec</h3>
                        <p className="text-gray-500">
                            Résultat instantané
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
                        <div className="text-5xl mb-3">🎁</div>
                        <h3 className="text-3xl font-black">5 gratuites</h3>
                        <p className="text-gray-500">
                            Sans inscription
                        </p>
                    </div>
                </div>
            </section>

            {/* ANALYZER */}
            <section id="analyzer" className="py-16 px-6">
                <div
                    className="
                    max-w-4xl
                    mx-auto
                    bg-white
                    rounded-3xl
                    shadow-xl
                    p-8
                "
                >
                    <h2 className="text-3xl font-black text-center mb-3">
                        🔍 Analysez votre mot-clé
                    </h2>

                    <p className="text-center text-gray-500 mb-8">
                        Entrez un mot-clé et découvrez
                        son potentiel SEO immédiatement.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <input
                            value={keyword}
                            onChange={(e) =>
                                setKeyword(e.target.value)
                            }
                            placeholder="Ex : plombier paris"
                            className="
                            flex-1
                            border-2
                            border-gray-200
                            rounded-2xl
                            px-5
                            py-4
                            text-lg
                            focus:outline-none
                            focus:border-indigo-500
                        "
                        />

                        <button
                            onClick={handleAnalyze}
                            disabled={loading || limitReached}
                            className="
                            bg-indigo-600
                            hover:bg-indigo-700
                            text-white
                            px-8
                            py-4
                            rounded-2xl
                            font-bold
                            transition
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                        "
                        >
                            {loading
                                ? "⏳ Analyse..."
                                : limitReached
                                    ? "🔒 Limite atteinte"
                                    : "🚀 Analyser"}
                        </button>
                    </div>

                    {/* PROGRESS */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Analyses gratuites</span>
                            <span>{used}/{FREE_LIMIT}</span>
                        </div>

                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 transition-all"
                                style={{
                                    width: `${(used / FREE_LIMIT) * 100}%`
                                }}
                            />
                        </div>

                        <p className="text-sm text-gray-500 mt-3">
                            {remaining > 0
                                ? `Il vous reste ${remaining} analyse(s) gratuite(s).`
                                : "Vos 5 analyses gratuites ont été utilisées."}
                        </p>
                    </div>

                    {error && (
                        <div
                            className="
                            bg-red-50
                            border
                            border-red-200
                            text-red-600
                            p-4
                            rounded-2xl
                            mb-4
                        "
                        >
                            {error}
                        </div>
                    )}

                    {limitReached && (
                        <div
                            className="
                            bg-indigo-50
                            border
                            border-indigo-200
                            rounded-2xl
                            p-5
                            flex
                            flex-col
                            md:flex-row
                            items-start
                            md:items-center
                            justify-between
                            gap-4
                        "
                        >
                            <div>
                                <h3 className="font-bold text-indigo-700 mb-1">
                                    Débloquez votre dashboard
                                </h3>
                                <p className="text-sm text-indigo-600">
                                    Créez un compte gratuit pour accéder au dashboard,
                                    conserver votre historique et continuer à découvrir l’application.
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(`/${lang}/register`)
                                }
                                className="
                                bg-indigo-600
                                hover:bg-indigo-700
                                text-white
                                px-6
                                py-3
                                rounded-xl
                                font-bold
                                whitespace-nowrap
                            "
                            >
                                Créer mon compte gratuit
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* RESULT */}
            {result && (
                <section className="px-6 pb-16">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-4xl font-black mb-4">
                                🎯 Résultat de votre analyse
                            </h2>

                            <p className="text-gray-500">
                                Voici les données SEO de votre mot-clé.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                                <div className="text-5xl mb-4">🎯</div>
                                <h3 className="text-gray-500 mb-2">
                                    Score SEO
                                </h3>
                                <div className="text-5xl font-black text-indigo-600">
                                    {result.scoreFinal || result.score || 0}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                                <div className="text-5xl mb-4">📊</div>
                                <h3 className="text-gray-500 mb-2">
                                    Volume
                                </h3>
                                <div className="text-5xl font-black text-green-600">
                                    {result.volume || 0}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                                <div className="text-5xl mb-4">💰</div>
                                <h3 className="text-gray-500 mb-2">
                                    CPC
                                </h3>
                                <div className="text-5xl font-black text-amber-600">
                                    {result.cpc || 0}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
                                <div className="text-5xl mb-4">⚔️</div>
                                <h3 className="text-gray-500 mb-2">
                                    Difficulté
                                </h3>
                                <div className="text-5xl font-black text-red-600">
                                    {result.competition || result.difficulty || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* PRO */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-5xl font-black mb-4">
                            🚀 Passez à la version PRO
                        </h2>

                        <p className="text-gray-500 text-lg">
                            Débloquez toutes les fonctionnalités SEO avancées.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="border rounded-3xl p-8">
                            <h3 className="text-3xl font-black mb-6">
                                Gratuit
                            </h3>

                            <ul className="space-y-4 text-gray-600">
                                <li>✅ 5 analyses SEO sans compte</li>
                                <li>✅ Analyse de base</li>
                                <li>✅ Création d’un compte gratuit ensuite</li>
                                <li>❌ Annuaire SEO</li>
                                <li>❌ Fonctions premium</li>
                            </ul>
                        </div>

                        <div
                            className="
                            bg-gradient-to-r
                            from-indigo-600
                            to-purple-600
                            text-white
                            rounded-3xl
                            p-8
                        "
                        >
                            <h3 className="text-3xl font-black mb-6">
                                PRO
                            </h3>

                            <ul className="space-y-4">
                                <li>✅ Analyses illimitées</li>
                                <li>✅ Historique complet</li>
                                <li>✅ Dashboard SEO</li>
                                <li>✅ Annuaire SEO</li>
                                <li>✅ IA SEO avancée</li>
                            </ul>

                            <button
                                onClick={() =>
                                    navigate(`/${lang}/register`)
                                }
                                className="
                                mt-8
                                bg-white
                                text-indigo-600
                                px-8
                                py-4
                                rounded-2xl
                                font-bold
                            "
                            >
                                Créer mon compte
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section
                className="
                py-24
                px-6
                bg-gradient-to-r
                from-indigo-600
                via-blue-600
                to-purple-600
                text-white
            "
            >
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-6xl font-black mb-6">
                        Prêt à développer votre visibilité Google ?
                    </h2>

                    <p className="text-xl mb-10 text-indigo-100">
                        Testez gratuitement, puis créez votre compte pour aller plus loin.
                    </p>

                    <div
                        className="
                        flex
                        flex-col
                        md:flex-row
                        justify-center
                        gap-4
                    "
                    >
                        <button
                            onClick={() =>
                                navigate(`/${lang}/register`)
                            }
                            className="
                            bg-white
                            text-indigo-600
                            px-8
                            py-4
                            rounded-2xl
                            font-bold
                        "
                        >
                            🚀 Créer un compte
                        </button>

                        <button
                            onClick={() =>
                                navigate(`/${lang}/login`)
                            }
                            className="
                            border-2
                            border-white
                            px-8
                            py-4
                            rounded-2xl
                            font-bold
                        "
                        >
                            🔑 Connexion
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}