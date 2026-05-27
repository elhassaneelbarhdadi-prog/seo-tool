import { useNavigate, useParams } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    return (
        <div className="min-h-screen bg-white">

            {/* HERO */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 text-center">

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    🚀 Trouvez une niche rentable en 30 secondes
                </h1>

                <p className="text-lg md:text-xl mb-8 text-indigo-100">
                    Analysez un mot-clé, découvrez son potentiel et générez du trafic gratuitement avec Google.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-black px-8 py-4 rounded-xl text-white text-lg font-semibold hover:scale-105 transition"
                >
                    🔍 Analyser un mot-clé maintenant
                </button>

                <p className="mt-6 text-sm text-indigo-200">
                    ⚡ Résultat en moins de 5 secondes
                </p>

            </section>

            {/* PREUVE */}
            <section className="p-10 text-center">

                <div className="flex flex-col md:flex-row justify-center gap-8 text-gray-700">

                    <div>
                        <p className="text-2xl font-bold">+120</p>
                        <p>business lancés</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">+35%</p>
                        <p>trafic SEO moyen</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">€€€</p>
                        <p>revenus générés</p>
                    </div>

                </div>

            </section>

            {/* PROBLÈME */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    Pourquoi la plupart échouent ?
                </h2>

                <div className="space-y-3 text-gray-600">
                    <p>❌ Mauvais choix de niche</p>
                    <p>❌ Trop de concurrence</p>
                    <p>❌ Aucun potentiel réel</p>
                </div>

            </section>

            {/* SOLUTION */}
            <section className="p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    Une seule plateforme pour réussir
                </h2>

                <div className="max-w-6xl mx-auto px-6 py-16">

                    <h2 className="text-4xl font-bold text-center mb-12">
                        Une seule plateforme pour réussir
                    </h2>

                    <div className="grid md:grid-cols-2 gap-10 text-lg">

                        <ul className="space-y-6">
                            <li>✓ Niches rentables détectées automatiquement</li>
                            <li>✓ Estimation de revenus</li>
                            <li>✓ Acquisition client gratuite via Google</li>
                        </ul>

                        <ul className="space-y-6">
                            <li>✓ Analyse réelle du marché</li>
                            <li>✓ Stratégie SEO prête à l'emploi</li>
                            <li>✓ Référencement web optimisé</li>
                        </ul>

                    </div>

                </div>

            </section>

            {/* DEMO */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    ⚡ Comment ça marche
                </h2>

                <div className="space-y-3 text-gray-700">
                    <p>1️⃣ Entrez un mot-clé</p>
                    <p>2️⃣ Analyse automatique du potentiel</p>
                    <p>3️⃣ Découvrez une opportunité rentable</p>
                    <p>4️⃣ Lancez votre business</p>
                </div>

            </section>

            {/* ANNUAIRE */}
            <section className="p-10 text-center">

                <h2 className="text-2xl font-bold mb-4">
                    📍 Attirez des clients gratuitement
                </h2>

                <p className="text-gray-600 mb-6">
                    Positionnez votre entreprise sur Google et recevez des clients sans publicité.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/register`)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
                >
                    🚀 Créer mon profil SEO
                </button>

            </section>

            {/* CTA FINAL */}
            <section className="bg-black text-white p-12 text-center">

                <h2 className="text-3xl font-bold mb-4">
                    Lance ton premier business rentable dès aujourd’hui
                </h2>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-indigo-600 px-8 py-4 rounded-xl text-lg hover:scale-105 transition"
                >
                    🚀 Trouver une niche maintenant
                </button>

            </section>

        </div>
    );
}