import { useState } from "react";
import useApi from "../hooks/useApi";

export default function SEOChat({ result }) {

    const api = useApi();

    const isDev = import.meta.env.DEV;

    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isLimitReached = result?.limitReached;

    /* ========================= */
    /* HANDLE ASK */
    /* ========================= */

    const handleAsk = async () => {

        if (!question.trim()) return;

        // 🔥 bloque seulement en prod
        if (!isDev && isLimitReached) return;

        setLoading(true);
        setError("");
        setAnswer("");

        try {

            const data = await api.post("/chat/seo", {
                prompt: question,
                keyword: result?.keyword,
                serp: result?.serp,
                products: result?.products
            });

            if (!data) return;

            setAnswer(data?.result || "Pas de réponse de l'IA");

        } catch (err) {

            console.error("CHAT ERROR:", err);
            setError("Une erreur est survenue avec l'IA");

        } finally {

            setLoading(false);
        }
    };

    /* ========================= */
    /* UI */
    /* ========================= */

    return (

        <div className="bg-white p-6 rounded-2xl shadow mt-6">

            {/* TITLE */}
            <h2 className="text-xl font-bold mb-4">
                🤖 Coach SEO IA
            </h2>

            {/* INPUT */}
            <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Est-ce une bonne niche ? Comment me positionner ?"
                className="w-full border p-4 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* BUTTON */}
            <button
                onClick={handleAsk}
                disabled={loading}
                className="bg-black text-white px-6 py-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition"
            >
                {loading ? "🤖 Analyse..." : "💬 Demander à l'IA"}
            </button>

            {/* ERROR */}
            {error && (
                <p className="text-red-500 mt-4">
                    {error}
                </p>
            )}

            {/* ANSWER */}
            {answer && (
                <div className="bg-gray-100 p-5 mt-5 rounded-xl whitespace-pre-line">
                    {answer}
                </div>
            )}

        </div>
    );
}