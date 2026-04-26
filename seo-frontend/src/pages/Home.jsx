import { useNavigate, useParams } from "react-router-dom";

export default function Home() {

    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    return (
        <div className="min-h-screen bg-white">

            {/* ========================= */}
            {/* 🚀 HERO */}
            {/* ========================= */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 text-center">

                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    🚀 Transformez un mot-clé en business rentable
                </h1>

                <p className="text-lg md:text-xl mb-8 text-indigo-100">
                    Trouvez une niche, analysez son potentiel et générez du trafic gratuitement avec Google.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-black px-8 py-4 rounded-xl text-white text-lg font-semibold hover:scale-105 transition"
                >
                    🔍 Trouver une opportunité rentable
                </button>

                <p className="mt-6 text-sm text-indigo-200">
                    💡 +120 niches analysées cette semaine
                </p>

            </section>

            {/* ========================= */}
            {/* 🔥 PREUVE */}
            {/* ========================= */}
            <section className="p-10 text-center">

                <div className="flex flex-col md:flex-row justify-center gap-8 text-gray-700">

                    <div>
                        <p className="text-2xl font-bold">+120</p>
                        <p>entreprises visibles</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">+35%</p>
                        <p>trafic SEO moyen</p>
                    </div>

                    <div>
                        <p className="text-2xl font-bold">∞</p>
                        <p>opportunités détectées</p>
                    </div>

                </div>

            </section>

            {/* ========================= */}
            {/* ❌ PROBLÈME */}
            {/* ========================= */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    Pourquoi c’est difficile aujourd’hui ?
                </h2>

                <div className="space-y-3 text-gray-600">
                    <p>❌ Vous ne savez pas quelle niche choisir</p>
                    <p>❌ Le SEO est trop compliqué</p>
                    <p>❌ Vous perdez du temps sur des idées non rentables</p>
                </div>

            </section>

            {/* ========================= */}
            {/* 💡 SOLUTION */}
            {/* ========================= */}
            <section className="p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    Une seule plateforme pour tout faire
                </h2>

                <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">

                    <p>✔ Trouver des niches rentables</p>
                    <p>✔ Analyser la concurrence</p>
                    <p>✔ Estimer les revenus</p>
                    <p>✔ Générer du trafic SEO</p>
                    <p>✔ Attirer des clients automatiquement</p>

                </div>

            </section>

            {/* ========================= */}
            {/* ⚡ DEMO */}
            {/* ========================= */}
            <section className="bg-gray-50 p-10 text-center">

                <h2 className="text-2xl font-bold mb-6">
                    ⚡ Comment ça marche
                </h2>

                <div className="space-y-3 text-gray-700">
                    <p>1️⃣ Entrez un mot-clé</p>
                    <p>2️⃣ Découvrez son potentiel</p>
                    <p>3️⃣ Lancez votre projet</p>
                    <p>4️⃣ Générez du trafic avec Google</p>
                </div>

            </section>

            {/* ========================= */}
            {/* 📍 ANNUAIRE */}
            {/* ========================= */}
            <section className="p-10 text-center">

                <h2 className="text-2xl font-bold mb-4">
                    📍 Attirez des clients gratuitement avec le SEO
                </h2>

                <p className="text-gray-600 mb-6">
                    Ajoutez votre entreprise et apparaissez sur Google sans publicité.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/register`)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
                >
                    🚀 Ajouter mon entreprise
                </button>

            </section>

            {/* ========================= */}
            {/* 🔥 CTA FINAL */}
            {/* ========================= */}
            <section className="bg-black text-white p-12 text-center">

                <h2 className="text-3xl font-bold mb-4">
                    Prêt à lancer ton business ?
                </h2>

                <button
                    onClick={() => navigate(`/${lang}/dashboard/keywords`)}
                    className="bg-indigo-600 px-8 py-4 rounded-xl text-lg hover:scale-105 transition"
                >
                    🚀 Lancer mon projet maintenant
                </button>

            </section>

        </div>
    );
}