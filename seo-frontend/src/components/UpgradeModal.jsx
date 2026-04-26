import { useNavigate, useParams } from "react-router-dom";

export default function UpgradeModal({ isOpen, onClose }) {

    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">

                <h2 className="text-2xl font-bold mb-3">
                    🚫 Limite atteinte
                </h2>

                <p className="text-gray-600 mb-6">
                    Vous avez utilisé toutes vos analyses gratuites ce mois-ci.
                </p>

                <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-sm">
                    🔥 Passez à PRO pour :
                    <ul className="mt-2 space-y-1 text-left">
                        <li>✓ Analyses illimitées</li>
                        <li>✓ Génération de niches</li>
                        <li>✓ Suggestions SEO avancées</li>
                    </ul>
                </div>

                <div className="flex gap-3">

                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard/pricing`)}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
                    >
                        🚀 Voir les plans
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 border py-3 rounded-xl"
                    >
                        Plus tard
                    </button>

                </div>

            </div>

        </div>
    );
}