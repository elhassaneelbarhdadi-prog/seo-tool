
import { useNavigate, useParams } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    return (
        <div className="min-h-screen bg-white">

            {/* HERO */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 text-center">

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    🚀 Outil SEO gratuit pour trouver des mots-clés rentables
                </h1>

                <p className="text-lg md:text-xl mb-8 text-indigo-100 max-w-3xl mx-auto">
                    Analysez un mot-clé, découvrez son potentiel SEO, estimez son trafic
                    et identifiez les meilleures opportunités de croissance pour votre activité.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-black px-8 py-4 rounded-xl text-white text-lg font-semibold hover:scale-105 transition"
                >
                    🚀 Tester gratuitement (5 analyses)
                </button>

                <p className="mt-6 text-sm text-indigo-200">
                    ⚡ Résultat en moins de 5 secondes
                </p>

            </section>

            {/* PREUVE SOCIALE */}
            <section className="p-10 text-center">

                <div className="flex flex-col md:flex-row justify-center gap-10 text-gray-700">

                    <div>
                        <p className="text-3xl font-bold">+1 000</p>
                        <p>analyses réalisées</p>
                    </div>

                    <div>
                        <p className="text-3xl font-bold">+35%</p>
                        <p>trafic SEO moyen observé</p>
                    </div>

                    <div>
                        <p className="text-3xl font-bold">24/7</p>
                        <p>analyse automatisée</p>
                    </div>

                </div>

            </section>

            {/* PROBLÈME */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-3xl font-bold mb-6">
                    Pourquoi la plupart des projets SEO échouent ?
                </h2>

                <div className="space-y-3 text-gray-600 text-lg">
                    <p>❌ Mauvais choix de mots-clés</p>
                    <p>❌ Trop de concurrence</p>
                    <p>❌ Aucun potentiel commercial réel</p>
                </div>

            </section>

            {/* SOLUTION */}
            <section className="p-10 text-center">

                <div className="max-w-6xl mx-auto px-6 py-16">

                    <h2 className="text-4xl font-bold text-center mb-12">
                        Une seule plateforme pour réussir votre SEO
                    </h2>

                    <div className="grid md:grid-cols-2 gap-10 text-lg text-left">

                        <ul className="space-y-6">
                            <li>✓ Détection automatique de mots-clés rentables</li>
                            <li>✓ Estimation du trafic potentiel</li>
                            <li>✓ Acquisition client gratuite via Google</li>
                        </ul>

                        <ul className="space-y-6">
                            <li>✓ Analyse réelle du marché</li>
                            <li>✓ Suggestions SEO intelligentes</li>
                            <li>✓ Référencement optimisé pour votre activité</li>
                        </ul>

                    </div>

                </div>

            </section>

            {/* COMMENT ÇA MARCHE */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-3xl font-bold mb-6">
                    ⚡ Comment ça marche ?
                </h2>

                <div className="space-y-4 text-gray-700 text-lg">
                    <p>1️⃣ Entrez un mot-clé</p>
                    <p>2️⃣ Analyse automatique du potentiel SEO</p>
                    <p>3️⃣ Découvrez les meilleures opportunités</p>
                    <p>4️⃣ Développez votre visibilité sur Google</p>
                </div>

            </section>

            {/* ANNUAIRE */}
            <section className="p-10 text-center">

                <h2 className="text-3xl font-bold mb-4">
                    📍 Attirez des clients gratuitement
                </h2>

                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Créez votre profil professionnel, améliorez votre visibilité locale
                    et recevez des visiteurs depuis Google sans dépenser en publicité.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/register`)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition"
                >
                    🚀 Créer mon profil SEO
                </button>

            </section>

            {/* CTA FINAL */}
            <section className="bg-black text-white p-12 text-center">

                <h2 className="text-3xl font-bold mb-4">
                    Trouvez votre prochaine opportunité SEO rentable
                </h2>

                <p className="text-gray-300 mb-8">
                    Commencez gratuitement avec 5 analyses offertes.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-indigo-600 px-8 py-4 rounded-xl text-lg hover:scale-105 transition"
                >
                    🚀 Commencer gratuitement
                </button>

            </section>

        </div>
    );
}

