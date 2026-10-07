import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function ReferencerEntreprise() {
    const { lang = "fr" } = useParams();

    return (
        <>
            <Helmet>

                <title>
                    Référencer mon entreprise | Référencement SEO local | Referencia SEO
                </title>

                <meta
                    name="description"
                    content="Référencez votre entreprise avec Referencia SEO. Développez votre visibilité en ligne, améliorez votre référencement local et présentez votre activité dans notre annuaire professionnel."
                />

                <meta
                    name="robots"
                    content="index, follow"
                />

                <link
                    rel="canonical"
                    href={`https://www.referenciaseo.com/${lang}/referencer-mon-entreprise`}
                />

                <meta
                    property="og:title"
                    content="Référencer mon entreprise | Referencia SEO"
                />

                <meta
                    property="og:description"
                    content="Développez la visibilité de votre entreprise grâce au référencement SEO local et à l'annuaire professionnel Referencia SEO."
                />

                <meta
                    property="og:url"
                    content={`https://www.referenciaseo.com/${lang}/referencer-mon-entreprise`}
                />

            </Helmet>


            <main className="bg-gray-50">

                {/* ========================= */}
                {/* HERO */}
                {/* ========================= */}

                <section className="bg-white">

                    <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">

                        <div className="max-w-4xl mx-auto text-center">

                            <div className="inline-block mb-5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-semibold text-sm">
                                🚀 Référencement professionnel
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">

                                Référencer mon entreprise

                            </h1>

                            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-8">

                                Développez la visibilité de votre entreprise
                                grâce au référencement SEO local et à notre
                                annuaire professionnel.

                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4">

                                <Link
                                    to={`/${lang}/pricing`}
                                    className="
                                        bg-indigo-600
                                        hover:bg-indigo-700
                                        text-white
                                        px-8
                                        py-4
                                        rounded-xl
                                        font-bold
                                        text-lg
                                        transition
                                    "
                                >
                                    Voir les abonnements
                                </Link>

                                <Link
                                    to={`/${lang}/annuaire`}
                                    className="
                                        border
                                        border-gray-300
                                        hover:bg-gray-100
                                        text-gray-800
                                        px-8
                                        py-4
                                        rounded-xl
                                        font-semibold
                                        text-lg
                                        transition
                                    "
                                >
                                    Voir l'annuaire
                                </Link>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ========================= */}
                {/* POURQUOI */}
                {/* ========================= */}

                <section className="py-16">

                    <div className="max-w-6xl mx-auto px-6">

                        <div className="text-center mb-12">

                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">

                                Pourquoi référencer votre entreprise ?

                            </h2>

                            <p className="text-gray-600 text-lg max-w-3xl mx-auto">

                                Une présence en ligne optimisée permet à vos
                                clients potentiels de trouver plus facilement
                                votre activité et vos services.

                            </p>

                        </div>


                        <div className="grid md:grid-cols-3 gap-6">


                            <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100">

                                <div className="text-3xl mb-4">
                                    🔎
                                </div>

                                <h3 className="text-xl font-bold mb-3">
                                    Améliorez votre visibilité
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Présentez votre entreprise et vos services
                                    aux internautes qui recherchent votre
                                    activité.
                                </p>

                            </div>


                            <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100">

                                <div className="text-3xl mb-4">
                                    📍
                                </div>

                                <h3 className="text-xl font-bold mb-3">
                                    Développez votre référencement local
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Mettez en avant votre activité, votre ville
                                    et vos services pour renforcer votre
                                    présence dans les recherches locales.
                                </p>

                            </div>


                            <div className="bg-white p-7 rounded-2xl shadow-sm border border-gray-100">

                                <div className="text-3xl mb-4">
                                    📈
                                </div>

                                <h3 className="text-xl font-bold mb-3">
                                    Développez votre présence en ligne
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Disposez d'une présence professionnelle
                                    dans l'annuaire Referencia SEO.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ========================= */}
                {/* COMMENT ÇA MARCHE */}
                {/* ========================= */}

                <section className="bg-white py-16">

                    <div className="max-w-6xl mx-auto px-6">

                        <div className="text-center mb-12">

                            <h2 className="text-3xl lg:text-4xl font-black mb-4">

                                Comment référencer mon entreprise ?

                            </h2>

                            <p className="text-gray-600 text-lg">

                                Quelques étapes pour développer votre présence
                                sur Referencia SEO.

                            </p>

                        </div>


                        <div className="grid md:grid-cols-4 gap-6">


                            <div className="text-center">

                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    1
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Choisissez votre abonnement
                                </h3>

                                <p className="text-gray-600">
                                    Sélectionnez l'offre adaptée aux besoins
                                    de votre entreprise.
                                </p>

                            </div>


                            <div className="text-center">

                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    2
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Créez votre compte
                                </h3>

                                <p className="text-gray-600">
                                    Créez votre espace professionnel sur
                                    Referencia SEO.
                                </p>

                            </div>


                            <div className="text-center">

                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    3
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Ajoutez votre entreprise
                                </h3>

                                <p className="text-gray-600">
                                    Renseignez votre activité, votre ville,
                                    vos services et vos coordonnées.
                                </p>

                            </div>


                            <div className="text-center">

                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    4
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Développez votre visibilité
                                </h3>

                                <p className="text-gray-600">
                                    Votre présence dans l'annuaire contribue
                                    à renforcer votre visibilité en ligne.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ========================= */}
                {/* SEO LOCAL */}
                {/* ========================= */}

                <section className="py-16">

                    <div className="max-w-5xl mx-auto px-6">

                        <div className="bg-indigo-50 rounded-3xl p-8 lg:p-12">

                            <h2 className="text-3xl font-black mb-5">

                                Référencement local de votre entreprise

                            </h2>

                            <p className="text-gray-700 text-lg leading-relaxed mb-5">

                                Le référencement local permet de renforcer la
                                visibilité d'une entreprise auprès des personnes
                                qui recherchent des produits ou services dans
                                une zone géographique donnée.

                            </p>

                            <p className="text-gray-700 text-lg leading-relaxed">

                                Avec Referencia SEO, votre entreprise peut être
                                présentée dans notre annuaire professionnel
                                avec son activité, sa localisation, ses services
                                et ses informations utiles.

                            </p>

                        </div>

                    </div>

                </section>


                {/* ========================= */}
                {/* CTA */}
                {/* ========================= */}

                <section className="bg-gray-900 text-white py-16">

                    <div className="max-w-4xl mx-auto px-6 text-center">

                        <h2 className="text-3xl lg:text-4xl font-black mb-5">

                            Prêt à référencer votre entreprise ?

                        </h2>

                        <p className="text-gray-300 text-lg mb-8">

                            Choisissez votre abonnement et commencez à
                            développer votre visibilité avec Referencia SEO.

                        </p>

                        <Link
                            to={`/${lang}/pricing`}
                            className="
                                inline-block
                                bg-white
                                text-gray-900
                                px-8
                                py-4
                                rounded-xl
                                font-bold
                                text-lg
                                hover:bg-gray-100
                                transition
                            "
                        >
                            Découvrir les abonnements →
                        </Link>

                    </div>

                </section>


                {/* ========================= */}
                {/* FAQ */}
                {/* ========================= */}

                <section className="bg-white py-16">

                    <div className="max-w-4xl mx-auto px-6">

                        <h2 className="text-3xl font-black text-center mb-10">
                            Questions fréquentes
                        </h2>


                        <div className="space-y-6">


                            <div>

                                <h3 className="font-bold text-lg mb-2">
                                    Comment référencer mon entreprise ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Choisissez un abonnement Referencia SEO,
                                    créez votre compte puis renseignez les
                                    informations de votre entreprise afin de
                                    développer votre présence dans notre
                                    annuaire professionnel.
                                </p>

                            </div>


                            <div>

                                <h3 className="font-bold text-lg mb-2">
                                    Le référencement de mon entreprise est-il gratuit ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Le référencement professionnel proposé par
                                    Referencia SEO fonctionne avec un abonnement.
                                    Consultez nos offres pour connaître les
                                    fonctionnalités et services disponibles.
                                </p>

                            </div>


                            <div>

                                <h3 className="font-bold text-lg mb-2">
                                    Quel est l'intérêt d'un référencement local ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Le référencement local aide les internautes
                                    à trouver plus facilement les entreprises
                                    et services correspondant à leur recherche
                                    dans une zone géographique donnée.
                                </p>

                            </div>


                            <div>

                                <h3 className="font-bold text-lg mb-2">
                                    Où voir les entreprises référencées ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Les entreprises disponibles peuvent être
                                    consultées depuis notre annuaire
                                    professionnel.
                                </p>

                            </div>

                        </div>

                    </div>

                </section>

            </main>
        </>
    );
}