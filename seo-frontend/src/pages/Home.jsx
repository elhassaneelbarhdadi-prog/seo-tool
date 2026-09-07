
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function Home() {
    const navigate = useNavigate();
    const { lang = "fr" } = useParams();

    const canonicalUrl = `https://referenciaseo.com/${lang}/`;

    return (
        <div className="min-h-screen bg-white">

            {/* SEO */}
            <Helmet>
                <html lang={lang} />

                <title>
                    Outil SEO gratuit : mots-clés, analyse et référencement | Referencia SEO
                </title>

                <meta
                    name="description"
                    content="Utilisez notre outil SEO gratuit pour analyser vos mots-clés, étudier la concurrence, trouver des opportunités SEO et améliorer votre référencement."
                />

                <meta
                    name="robots"
                    content="index, follow"
                />

                <link
                    rel="canonical"
                    href={canonicalUrl}
                />

                <meta
                    property="og:title"
                    content="Referencia SEO | Outil SEO gratuit"
                />

                <meta
                    property="og:description"
                    content="Analysez vos mots-clés, étudiez la concurrence et trouvez des opportunités SEO pour développer votre visibilité sur Google."
                />

                <meta
                    property="og:type"
                    content="website"
                />

                <meta
                    property="og:url"
                    content={canonicalUrl}
                />

                <meta
                    property="og:site_name"
                    content="Referencia SEO"
                />
            </Helmet>

            {/* HERO */}
            <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24 px-6 text-center">

                <h1 className="text-5xl font-bold mb-6">
                    🚀 Outil SEO gratuit pour trouver des mots-clés rentables
                </h1>

                <p className="max-w-3xl mx-auto text-xl text-indigo-100 mb-10">
                    Découvrez des mots-clés rentables, analysez la concurrence
                    et trouvez des opportunités SEO capables de générer du trafic
                    et des clients pour votre activité.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/free-analyzer`)}
                    className="bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold hover:scale-105 transition"
                >
                    🚀 Tester gratuitement
                </button>

                <p className="mt-6 text-indigo-200">
                    🎁 5 analyses SEO gratuites pour commencer
                </p>

            </section>

            {/* PREUVE */}
            <section className="py-16 px-6">

                <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">

                    <div>
                        <h3 className="text-4xl font-bold text-indigo-600">
                            +1000
                        </h3>
                        <p className="text-gray-600">
                            analyses réalisées
                        </p>
                    </div>

                    <div>
                        <h3 className="text-4xl font-bold text-indigo-600">
                            &lt; 5s
                        </h3>
                        <p className="text-gray-600">
                            analyse SEO instantanée
                        </p>
                    </div>

                    <div>
                        <h3 className="text-4xl font-bold text-indigo-600">
                            5
                        </h3>
                        <p className="text-gray-600">
                            analyses gratuites offertes
                        </p>
                    </div>

                </div>

            </section>

            {/* PROBLEME */}
            <section className="bg-gray-50 py-20 px-6 text-center">

                <h2 className="text-4xl font-bold mb-10">
                    Pourquoi la plupart des projets SEO échouent ?
                </h2>

                <div className="space-y-4 text-xl text-gray-700">

                    <p>❌ Mauvais choix de mots-clés</p>
                    <p>❌ Concurrence trop forte</p>
                    <p>❌ Faible potentiel commercial</p>

                </div>

                <p className="max-w-3xl mx-auto mt-10 text-lg text-gray-600">
                    Referencia SEO vous aide à identifier les mots-clés les plus
                    intéressants avant de créer votre contenu. Analysez leur
                    potentiel, la concurrence et les opportunités SEO afin de
                    concentrer vos efforts sur les recherches qui peuvent
                    réellement développer votre activité.
                </p>

            </section>

            {/* SOLUTION */}
            <section className="py-20 px-6">

                <div className="max-w-6xl mx-auto">

                    <h2 className="text-4xl font-bold text-center mb-14">
                        Une plateforme SEO complète
                    </h2>

                    <div className="grid md:grid-cols-2 gap-12 text-lg">

                        <ul className="space-y-6">
                            <li>✅ Analyse de mots-clés</li>
                            <li>✅ Détection d'opportunités SEO</li>
                            <li>✅ Estimation du trafic potentiel</li>
                        </ul>

                        <ul className="space-y-6">
                            <li>✅ Suggestions SEO intelligentes</li>
                            <li>✅ Analyse de la concurrence</li>
                            <li>
                                ✅ Référencement de votre entreprise sur Google
                                via notre annuaire SEO
                            </li>
                        </ul>

                    </div>

                    {/* ANNUAIRE */}
                    <div className="mt-12 bg-indigo-50 rounded-2xl p-8">

                        <h3 className="text-2xl font-bold mb-4">
                            📍 Annuaire SEO Professionnel
                        </h3>

                        <p className="text-gray-600 mb-6">
                            Publiez votre entreprise dans notre annuaire SEO,
                            améliorez votre visibilité locale et obtenez des
                            visiteurs qualifiés depuis Google.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">

                            <Link
                                to={`/${lang}/annuaire`}
                                className="bg-white border border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl font-semibold text-center hover:bg-indigo-50"
                            >
                                🔎 Voir l'annuaire SEO
                            </Link>

                            <button
                                onClick={() => navigate(`/${lang}/register`)}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
                            >
                                Ajouter mon entreprise
                            </button>

                        </div>

                    </div>

                </div>

            </section>

            {/* CTA */}
            <section className="bg-black text-white py-20 px-6 text-center">

                <h2 className="text-4xl font-bold mb-6">
                    Commencez gratuitement aujourd'hui
                </h2>

                <p className="text-gray-300 mb-10">
                    Testez l'outil avec 5 analyses offertes.
                </p>

                <button
                    onClick={() => navigate(`/${lang}/register`)}
                    className="bg-indigo-600 px-8 py-4 rounded-xl text-lg hover:scale-105 transition"
                >
                    🚀 Créer un compte
                </button>

            </section>

        </div>
    );
}