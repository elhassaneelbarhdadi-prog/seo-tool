import { useNavigate, useParams } from "react-router-dom";

export default function Success() {

    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

            <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full space-y-6">

                {/* ICON */}
                <div className="text-5xl">🎉</div>

                {/* TITLE */}
                <h1 className="text-2xl font-bold text-green-600">
                    Paiement réussi !
                </h1>

                {/* TEXT */}
                <p className="text-gray-600">
                    Merci pour votre achat 🙌
                    Votre compte a été mis à jour avec succès.
                </p>

                {/* BONUS CTA (IMPORTANT BUSINESS) */}
                <div className="bg-green-50 p-4 rounded-xl text-sm text-green-700">
                    🚀 Vous pouvez maintenant accéder à toutes les fonctionnalités PRO
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col gap-3">

                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard`)}
                        className="bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                    >
                        📊 Accéder au dashboard
                    </button>

                    <button
                        onClick={() => navigate(`/${currentLang}/dashboard/keywords`)}
                        className="border py-3 rounded-xl hover:bg-gray-50 transition"
                    >
                        🔍 Analyser un mot-clé
                    </button>

                </div>

            </div>

        </div>
    );
}