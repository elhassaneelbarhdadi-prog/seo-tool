import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useMemo } from "react";
import { useSeoData } from "../hooks/useSeoData";
console.log("SEO HOOK LOADED");
const cleanKeywordFn = (str = "") => {
    let value = decodeURIComponent(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    while (/^(a|à|de|d'|du|des)\s+/i.test(value)) {
        value = value.replace(/^(a|à|de|d'|du|des)\s+/i, "").trim();
    }

    return value.replace(/\s+/g, " ");
};

const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

export default function ProjectPage() {

    const { keyword, lang } = useParams();
    const navigate = useNavigate();

    const currentLang = lang || "fr";

    const cleanKeyword = useMemo(
        () => cleanKeywordFn(keyword),
        [keyword]
    );

    const selectedCity = "paris";

    const slug = `${cleanKeyword.replace(/\s+/g, "-")}-${selectedCity}`;

    /* ✅ HOOK GLOBAL */
    const { seo, loading } = useSeoData(slug);

    if (!cleanKeyword) {
        return <div className="p-10 text-center">❌ Projet invalide</div>;
    }

    if (loading || !seo) {
        return <div className="p-10 text-center">Chargement...</div>;
    }

    const keywordLabel = capitalize(cleanKeyword);
    const cityLabel = capitalize(selectedCity);

    const title = `${keywordLabel} à ${cityLabel}`;
    const description = `Opportunité SEO : ${seo.revenue}€/mois`;

    return (
        <div className="max-w-4xl mx-auto p-10">

            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Helmet>

            <h1 className="text-4xl font-bold mb-4">
                🚀 {keywordLabel} à {cityLabel}
            </h1>

            <p className="text-gray-600 mb-6">
                À {cityLabel}, la recherche "<strong>{cleanKeyword}</strong>" représente une opportunité SEO réelle.
            </p>

            <div className="bg-green-50 p-6 rounded-xl mb-4">
                💰 {seo.revenue}€ / mois estimés
            </div>

            <div className="bg-yellow-50 p-6 rounded-xl mb-6">
                ⚔️ Concurrence {seo.competition}
            </div>

            <button
                onClick={() => navigate(`/${currentLang}/annuaire/${slug}`)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
            >
                🔍 Voir opportunités SEO
            </button>

        </div>
    );
}