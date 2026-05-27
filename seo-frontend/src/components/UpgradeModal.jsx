import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";

export default function UpgradeModal({ isOpen, onClose }) {

    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    // ✅ bloque scroll quand modal ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={onClose} // ✅ click outside = close
        >

            <div
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center relative"
                onClick={(e) => e.stopPropagation()} // ❌ évite fermeture interne
            >

                {/* ❌ bouton fermeture rapide */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl"
                >
                    ×
                </button>

                <h2 className="text-2xl font-bold mb-3">
                    🚫 Limite atteinte
                </h2>

                <p className="text-gray-600 mb-6">
                    Vous avez utilisé toutes vos analyses gratuites ce mois-ci.
                </p>

                <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-sm text-left">
                    <p className="font-semibold mb-2">
                        🔥 Passez à PRO pour :
                    </p>

                    <ul className="space-y-1">
                        <li>✓ Analyses illimitées</li>
                        <li>✓ Génération de niches</li>
                        <li>✓ Suggestions SEO avancées</li>
                    </ul>
                </div>

                <div className="flex gap-3">

                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard/pricing`)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                        🚀 Voir les plans
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 border py-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        Plus tard
                    </button>

                </div>

            </div>

        </div>
    );
}