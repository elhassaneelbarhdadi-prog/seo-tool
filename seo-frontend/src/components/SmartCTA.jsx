import useLangNavigate from "../hooks/useLangNavigate";
import { routes } from "../routes";

export default function SmartCTA({ usage }) {

    const { go } = useLangNavigate(); // ✅ CLEAN

    const handleClick = () => {

        const plan = usage?.plan || "FREE";
        const used = usage?.used || 0;
        const limit = usage?.limit || 0;

        if (limit !== Infinity && used >= limit) {
            return go(routes.pricing);
        }

        if (plan === "FREE") {
            return go(routes.pricing);
        }

        return go(routes.niches);
    };

    const getLabel = () => {

        const plan = usage?.plan || "FREE";
        const used = usage?.used || 0;
        const limit = usage?.limit || 0;

        if (limit !== Infinity && used >= limit) {
            return "⚠️ Limite atteinte - Upgrade";
        }

        if (plan === "FREE") {
            return "🚀 Passer au plan PRO";
        }

        return "🚀 Créer ma stratégie SEO";
    };

    return (
        <button
            onClick={handleClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition w-full"
        >
            {getLabel()}
        </button>
    );
}