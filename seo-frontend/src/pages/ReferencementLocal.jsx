import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function ReferencementLocal() {
    const { lang = "fr" } = useParams();

    const canonical =
        `https://www.referenciaseo.com/${lang}/referencement-local`;

    return (
        <>
            <Helmet>
                <title>
                    Référencement local | Améliorer la visibilité de son entreprise
                </title>

                <meta
                    name="description"
                    content="Améliorez le référencement local de votre entreprise avec Referencia SEO. Développez votre visibilité, présentez vos services et renforcez votre présence dans les recherches locales."
                />

                <meta
                    name="robots"
                    content="index, follow"
                />

                <link
                    rel="canonical"
                    href={canonical}
                />

                <meta
                    property="og:title"
                    content="Référencement local | Referencia SEO"
                />

                <meta
                    property="og:description"
                    content="Développez la visibilité locale de votre entreprise avec Referencia SEO et notre annuaire professionnel."
                />

                <meta
                    property="og:url"
                    content={canonical}
                />
            </Helmet>

            <main className="bg-gray-50">

                {/* HERO */}
                <section className="bg-white">
                    <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">

                        <div className="max-w-4xl mx-auto text-center">

                            <div className="inline-block mb-5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-semibold text-sm">
                                📍 SEO local
                            </div>

                            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                                Référencement local
                            </h1>

                            <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed mb-8">
                                Améliorez la visibilité de votre entreprise
                                auprès des clients qui recherchent vos services
                                dans votre ville et votre région.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4">

                                <Link
                                    to={`/${lang}/referencer-mon-entreprise`}
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
                                    Référencer mon entreprise
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
                                    Consulter l'annuaire
                                </Link>

                            </div>

                        </div>
                    </div>
                </section>


                {/* INTRODUCTION */}
                <section className="py-16">
                    <div className="max-w-5xl mx-auto px-6">

                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
                            Qu'est-ce que le référencement local ?
                        </h2>

                        <div className="space-y-5 text-gray-700 text-lg leading-relaxed">

                            <p>
                                Le référencement local consiste à améliorer la
                                visibilité d'une entreprise dans les recherches
                                effectuées par des internautes à proximité de
                                son activité.
                            </p>

                            <p>
                                Lorsqu'une personne recherche un professionnel,
                                un commerce ou un service dans une ville, il est
                                important que les informations concernant
                                l'entreprise soient facilement accessibles et
                                clairement présentées.
                            </p>

                            <p>
                                Une présence optimisée sur Internet peut ainsi
                                aider une entreprise à développer sa visibilité
                                auprès d'une clientèle locale.
                            </p>

                        </div>

                    </div>
                </section>


                {/* BENEFICES */}
                <section className="bg-white py-16">

                    <div className="max-w-6xl mx-auto px-6">

                        <div className="text-center mb-12">

                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
                                Pourquoi travailler son référencement local ?
                            </h2>

                            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                                Le référencement local permet de mieux présenter
                                votre activité aux personnes qui recherchent
                                vos produits ou services dans votre zone.
                            </p>

                        </div>


                        <div className="grid md:grid-cols-3 gap-6">

                            <div className="bg-gray-50 p-7 rounded-2xl border border-gray-100">
                                <div className="text-3xl mb-4">📍</div>

                                <h3 className="text-xl font-bold mb-3">
                                    Être visible localement
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Présentez votre entreprise en associant votre
                                    activité à votre ville et à votre zone
                                    géographique.
                                </p>
                            </div>


                            <div className="bg-gray-50 p-7 rounded-2xl border border-gray-100">
                                <div className="text-3xl mb-4">🔎</div>

                                <h3 className="text-xl font-bold mb-3">
                                    Être trouvé par vos clients
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Aidez les internautes à découvrir votre
                                    entreprise lorsqu'ils recherchent vos
                                    services localement.
                                </p>
                            </div>


                            <div className="bg-gray-50 p-7 rounded-2xl border border-gray-100">
                                <div className="text-3xl mb-4">📈</div>

                                <h3 className="text-xl font-bold mb-3">
                                    Développer votre présence en ligne
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Une fiche professionnelle bien renseignée
                                    permet de présenter clairement votre activité,
                                    vos services et votre localisation.
                                </p>
                            </div>

                        </div>

                    </div>
                </section>


                {/* REFERENCIA SEO */}
                <section className="py-16">

                    <div className="max-w-5xl mx-auto px-6">

                        <div className="bg-indigo-50 rounded-3xl p-8 lg:p-12">

                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">
                                Référencement local avec Referencia SEO
                            </h2>

                            <p className="text-gray-700 text-lg leading-relaxed mb-5">
                                Referencia SEO permet aux professionnels de
                                présenter leur entreprise dans un annuaire
                                professionnel pensé pour améliorer leur présence
                                en ligne.
                            </p>

                            <p className="text-gray-700 text-lg leading-relaxed mb-5">
                                Votre fiche peut présenter votre activité, votre
                                localisation, vos services et vos coordonnées
                                afin de donner aux internautes les informations
                                essentielles dont ils ont besoin.
                            </p>

                            <p className="text-gray-700 text-lg leading-relaxed">
                                L'objectif est de créer une présence cohérente
                                entre votre activité, votre zone géographique et
                                les recherches effectuées par vos futurs clients.
                            </p>

                        </div>

                    </div>
                </section>


                {/* EXEMPLES */}
                <section className="bg-white py-16">

                    <div className="max-w-6xl mx-auto px-6">

                        <h2 className="text-3xl lg:text-4xl font-black text-center mb-10">
                            Exemples de recherches locales
                        </h2>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

                            {[
                                "coiffeur Guesnain",
                                "plombier Guesnain",
                                "restaurant Guesnain",
                                "hijama Guesnain",
                                "garage Douai",
                                "dentiste Lille",
                                "photographe Lens",
                                "restaurant Valenciennes"
                            ].map((query) => (
                                <div
                                    key={query}
                                    className="
                                        bg-gray-50
                                        border
                                        border-gray-200
                                        rounded-xl
                                        p-5
                                        text-center
                                        font-semibold
                                        text-gray-800
                                    "
                                >
                                    {query}
                                </div>
                            ))}

                        </div>

                    </div>
                </section>


                {/* COMMENT ÇA MARCHE */}
                <section className="py-16">

                    <div className="max-w-6xl mx-auto px-6">

                        <h2 className="text-3xl lg:text-4xl font-black text-center mb-12">
                            Comment améliorer son référencement local ?
                        </h2>

                        <div className="grid md:grid-cols-4 gap-6">

                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    1
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Présenter son entreprise
                                </h3>

                                <p className="text-gray-600">
                                    Décrivez clairement votre activité et vos
                                    principaux services.
                                </p>
                            </div>


                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    2
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Indiquer sa localisation
                                </h3>

                                <p className="text-gray-600">
                                    Associez votre activité à votre ville et à
                                    votre zone d'intervention.
                                </p>
                            </div>


                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    3
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Optimiser ses informations
                                </h3>

                                <p className="text-gray-600">
                                    Utilisez des informations précises et
                                    cohérentes pour votre entreprise.
                                </p>
                            </div>


                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-black">
                                    4
                                </div>

                                <h3 className="font-bold text-lg mb-2">
                                    Développer sa présence
                                </h3>

                                <p className="text-gray-600">
                                    Renforcez progressivement votre présence
                                    numérique avec un référencement local
                                    cohérent.
                                </p>
                            </div>

                        </div>

                    </div>
                </section>


                {/* CTA */}
                <section className="bg-gray-900 text-white py-16">

                    <div className="max-w-4xl mx-auto px-6 text-center">

                        <h2 className="text-3xl lg:text-4xl font-black mb-5">
                            Améliorez votre référencement local
                        </h2>

                        <p className="text-gray-300 text-lg mb-8">
                            Développez la visibilité de votre entreprise avec
                            Referencia SEO et notre annuaire professionnel.
                        </p>

                        <Link
                            to={`/${lang}/referencer-mon-entreprise`}
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
                            Référencer mon entreprise →
                        </Link>

                    </div>
                </section>


                {/* FAQ */}
                <section className="bg-white py-16">

                    <div className="max-w-4xl mx-auto px-6">

                        <h2 className="text-3xl font-black text-center mb-10">
                            Questions fréquentes sur le référencement local
                        </h2>

                        <div className="space-y-6">

                            <div>
                                <h3 className="font-bold text-lg mb-2">
                                    Qu'est-ce que le référencement local ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Le référencement local vise à améliorer la
                                    visibilité d'une entreprise dans les recherches
                                    associées à une zone géographique.
                                </p>
                            </div>


                            <div>
                                <h3 className="font-bold text-lg mb-2">
                                    Comment améliorer le référencement local de mon entreprise ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Commencez par présenter clairement votre
                                    activité, vos services, votre localisation
                                    et vos coordonnées, puis développez une
                                    présence cohérente sur les supports adaptés
                                    à votre activité.
                                </p>
                            </div>


                            <div>
                                <h3 className="font-bold text-lg mb-2">
                                    Pourquoi la ville est-elle importante en SEO local ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    La localisation permet de mieux correspondre
                                    aux recherches effectuées par des internautes
                                    qui cherchent un service dans une zone précise.
                                </p>
                            </div>


                            <div>
                                <h3 className="font-bold text-lg mb-2">
                                    Comment référencer mon entreprise avec Referencia SEO ?
                                </h3>

                                <p className="text-gray-600 leading-relaxed">
                                    Vous pouvez découvrir nos offres de
                                    référencement professionnel et créer votre
                                    présence dans notre annuaire.
                                </p>
                            </div>

                        </div>

                    </div>
                </section>

            </main>
        </>
    );
}