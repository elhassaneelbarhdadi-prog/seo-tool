import { useState, useRef } from "react";
import { request } from "../services/api";

export default function SEOChat({ result }) {

    const isDev = import.meta.env.DEV;

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const abortRef = useRef(null);

    const isLimitReached = result?.limitReached;

    /* ========================= */
    /* HANDLE ASK */
    /* ========================= */
    const handleAsk = async () => {

        if (!question.trim() || loading) return;

        if (!isDev && isLimitReached) {
            setError("Limite atteinte — passe au plan PRO");
            return;
        }

        setLoading(true);
        setError("");
        setAnswer("");

        try {

            // 🔥 cancel previous request
            if (abortRef.current) {
                abortRef.current.abort();
            }

            const controller = new AbortController();
            abortRef.current = controller;

            const data = await request(
                "/chat/seo",
                {
                    method: "POST",
                    body: JSON.stringify({
                        prompt: question,
                        keyword: result?.keyword,
                        serp: result?.serp,
                        products: result?.products
                    }),
                    signal: controller.signal // ✅ clean
                }
            );

            setAnswer(data?.result || "Pas de réponse de l'IA");

        } catch (err) {

            if (err.name !== "AbortError") {
                console.error("CHAT ERROR:", err);
                setError("Une erreur est survenue avec l'IA");
            }

        } finally {
            setLoading(false);
        }
    };

    /* ========================= */
    /* ENTER HANDLER */
    /* ========================= */
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (

        <div className="bg-white p-6 rounded-2xl shadow mt-6">

            <h2 className="text-xl font-bold mb-4">
                🤖 Coach SEO IA
            </h2>

            {!isDev && isLimitReached && (
                <div className="mb-4 text-sm text-orange-500">
                    🔒 Limite atteinte — upgrade pour continuer
                </div>
            )}

            <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Est-ce une bonne niche ?"
                className="w-full border p-4 rounded-xl mb-4"
            />

            <button
                onClick={handleAsk}
                disabled={loading || (!isDev && isLimitReached)}
                className="bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50"
            >
                {loading ? "🤖 Analyse..." : "💬 Demander à l'IA"}
            </button>

            {error && (
                <p className="text-red-500 mt-4">{error}</p>
            )}

            {answer && (
                <div className="bg-gray-100 p-5 mt-5 rounded-xl whitespace-pre-line">
                    {answer}
                </div>
            )}

        </div>
    );
}