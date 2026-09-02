import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../config";

/* ========================= */
/* 🔥 CLEAN KEYWORD */
/* ========================= */
const cleanKeyword = (str = "") => {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^(a|à|de|d'|du|des)\s+/i, "")
        .trim()
        .replace(/\s+/g, " ");
};

/* ========================= */
/* 🔤 FORMAT */
/* ========================= */
const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

/* ========================= */
/* 📁 ANNUAIRE PAGE */
/* ========================= */
export default function AnnuairePage() {
    const { slug, lang = "fr" } = useParams();

    const [profiles, setProfiles] = useState([]);
    const [seoPage, setSeoPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ========================= */
    /* 🔐 PARSE SLUG */
    /* ========================= */
    const { keyword, city } = useMemo(() => {
        /*
         * IMPORTANT :
         * /fr/annuaire n'a pas de slug.
         * Dans ce cas, ce n'est PAS une page invalide.
         * C'est la page d'accueil publique de l'annuaire.
         */
        if (!slug) {
            return {
                keyword: "",
                city: ""
            };
        }

        const parts = slug
            .split("-")
            .filter(Boolean);

        if (parts.length < 2) {
            return {
                keyword: "",
                city: ""
            };
        }

        return {
            keyword: cleanKeyword(parts.slice(0, -1).join(" ")),
            city: parts.slice(-1).join("-")
        };
    }, [slug]);

    const isDirectoryHome = !slug;
    const isInvalidSlug = Boolean(slug) && (!keyword || !city);

    const keywordLabel = capitalize(keyword);
    const cityLabel = capitalize(city);

    /* ========================= */
    /* 🔥 LOAD DATA */
    /* ========================= */
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                /*
                 * =========================
                 * PAGE D'ACCUEIL ANNuaire
                 * =========================
                 */
                if (isDirectoryHome) {
                    const profilesRes = await fetch(
                        `${API_BASE}/business-profile`
                    );

                    let profilesData = null;

                    try {
                        profilesData = await profilesRes.json();
                    } catch {
                        throw new Error(
                            "Réponse business invalide"
                        );
                    }

                    if (!profilesRes.ok) {
                        throw new Error(
                            profilesData?.error ||
                            `BUSINESS PROFILE ERROR ${profilesRes.status}`
                        );
                    }

                    if (cancelled) return;

                    if (Array.isArray(profilesData?.businesses)) {
                        setProfiles(profilesData.businesses);
                    } else {
                        setProfiles([]);
                    }

                    setSeoPage(null);

                    return;
                }

                /*
                 * =========================
                 * SLUG INVALIDE
                 * =========================
                 */
                if (isInvalidSlug) {
                    return;
                }

                /*
                 * =========================
                 * PAGE SEO MÉTIER + VILLE
                 * =========================
                 */
                const [seoRes, profilesRes] = await Promise.all([
                    fetch(
                        `${API_BASE}/seo-page?slug=${encodeURIComponent(slug)}`
                    ),
                    fetch(`${API_BASE}/business-profile`)
                ]);

                let seoData = null;
                let profilesData = null;

                try {
                    seoData = await seoRes.json();
                } catch {
                    throw new Error(
                        "Réponse SEO invalide"
                    );
                }

                try {
                    profilesData = await profilesRes.json();
                } catch {
                    throw new Error(
                        "Réponse business invalide"
                    );
                }

                if (!seoRes.ok) {
                    throw new Error(
                        seoData?.error ||
                        `SEO PAGE ERROR ${seoRes.status}`
                    );
                }

                if (!profilesRes.ok) {
                    throw new Error(
                        profilesData?.error ||
                        `BUSINESS PROFILE ERROR ${profilesRes.status}`
                    );
                }

                if (cancelled) return;

                setSeoPage(seoData);

                if (Array.isArray(profilesData?.businesses)) {
                    const filtered = profilesData.businesses.filter((p) => {
                        const k = cleanKeyword(p?.keyword || "");
                        const c = (p?.city || "").toLowerCase();

                        return (
                            (k.includes(keyword) ||
                                keyword.includes(k)) &&
                            c.includes(city.toLowerCase())
                        );
                    });

                    setProfiles(filtered);
                } else {
                    setProfiles([]);
                }
            } catch (err) {
                console.error(
                    "ANNUAIRE PAGE ERROR:",
                    err
                );

                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Erreur de chargement"
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [
        slug,
        keyword,
        city,
        isDirectoryHome,
        isInvalidSlug
    ]);

    /* ========================= */
    /* ❌ SLUG INVALIDE */
    /* ========================= */
    if (isInvalidSlug) {
        return (
            <>
                <Helmet>
                    <title>
                        Annuaire SEO | Référencia SEO
                    </title>

                    <meta
                        name="description"
                        content="Découvrez notre annuaire SEO professionnel et trouvez des entreprises et professionnels référencés."
                    />
                </Helmet>

                <div className="max-w-4xl mx-auto p-10 text-center">
                    <h1 className="text-3xl font-bold mb-4">
                        Page annuaire introuvable
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Cette page annuaire n'existe pas ou
                        l'adresse est incorrecte.
                    </p>

                    <Link
                        to={`/${lang}/annuaire`}
                        className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-xl"
                    >
                        Retour à l'annuaire
                    </Link>
                </div>
            </>
        );
    }

    /* ========================= */
    /* 🏠 PAGE D'ACCUEIL ANNUAIRE */
    /* ========================= */
    if (isDirectoryHome) {
        return (
            <div className="max-w-6xl mx-auto p-6 lg:p-10">
                <Helmet>
                    <title>
                        Annuaire SEO des entreprises | Référencia SEO
                    </title>

                    <meta
                        name="description"
                        content="Découvrez les entreprises et professionnels référencés dans notre annuaire SEO. Trouvez facilement un professionnel par activité et par ville."
                    />
                </Helmet>

                {/* ========================= */}
                {/* HERO */}
                {/* ========================= */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-black mb-5">
                        📁 Annuaire SEO des entreprises
                    </h1>

                    <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
                        Trouvez des entreprises et des professionnels
                        référencés dans notre annuaire SEO.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to={`/${lang}/register`}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
                        >
                            🚀 Référencer mon entreprise
                        </Link>

                        <Link
                            to={`/${lang}/`}
                            className="border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50"
                        >
                            ← Retour à Référencia SEO
                        </Link>
                    </div>
                </div>

                {/* ========================= */}
                {/* ERROR */}
                {/* ========================= */}
                {error && (
                    <div
                        className="
                            bg-red-50
                            border
                            border-red-200
                            text-red-600
                            p-4
                            rounded-xl
                            mb-8
                        "
                    >
                        {error}
                    </div>
                )}

                {/* ========================= */}
                {/* LISTE ENTREPRISES */}
                {/* ========================= */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                            🔝 Professionnels référencés
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Découvrez les entreprises présentes dans
                            notre annuaire.
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">
                                Chargement de l'annuaire...
                            </p>
                        </div>
                    ) : profiles.length === 0 ? (
                        <div
                            className="
                                bg-gray-100
                                p-8
                                rounded-xl
                                text-center
                            "
                        >
                            <p className="text-gray-600 mb-4">
                                Aucun professionnel n'est encore
                                référencé dans l'annuaire.
                            </p>

                            <Link
                                to={`/${lang}/register`}
                                className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-xl"
                            >
                                🚀 Référencer mon entreprise
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profiles.map((p, i) => (
                                <div
                                    key={p.id || i}
                                    className="
                                        bg-white
                                        p-6
                                        rounded-xl
                                        shadow
                                        border
                                        border-gray-100
                                    "
                                >
                                    <h3 className="font-bold text-xl mb-2">
                                        {p.name ||
                                            "Entreprise"}
                                    </h3>

                                    {p.keyword && (
                                        <p className="text-sm text-indigo-600 mb-2">
                                            🔎 {p.keyword}
                                        </p>
                                    )}

                                    {p.city && (
                                        <p className="text-sm text-gray-500 mb-3">
                                            📍 {p.city}
                                        </p>
                                    )}

                                    {p.description && (
                                        <p className="text-gray-700">
                                            {p.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ========================= */}
                {/* CTA */}
                {/* ========================= */}
                <div
                    className="
                        bg-indigo-50
                        p-8
                        rounded-2xl
                        mt-12
                        text-center
                    "
                >
                    <h2 className="text-2xl font-bold mb-3">
                        🚀 Développez votre visibilité sur Google
                    </h2>

                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Référencez votre entreprise dans notre annuaire
                        SEO et augmentez votre visibilité auprès de vos
                        futurs clients.
                    </p>

                    <Link
                        to={`/${lang}/register`}
                        className="
                            inline-block
                            bg-indigo-600
                            text-white
                            px-6
                            py-3
                            rounded-xl
                            font-semibold
                        "
                    >
                        S'inscrire gratuitement
                    </Link>
                </div>
            </div>
        );
    }

    /* ========================= */
    /* 🔎 PAGE SEO MÉTIER + VILLE */
    /* ========================= */

    const title =
        `${keywordLabel} à ${cityLabel} | Meilleurs services`;

    const description =
        seoPage?.content
            ?.replace(/<[^>]+>/g, "")
            ?.slice(0, 155) ||
        `Trouvez les meilleurs ${keywordLabel} à ${cityLabel}`;

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
            <Helmet>
                <title>{title}</title>

                <meta
                    name="description"
                    content={description}
                />
            </Helmet>

            {/* ========================= */}
            {/* ERROR */}
            {/* ========================= */}
            {error && (
                <div
                    className="
                        bg-red-50
                        border
                        border-red-200
                        text-red-600
                        p-4
                        rounded-xl
                        mb-6
                    "
                >
                    {error}
                </div>
            )}

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}
            <div className="text-center mb-10">
                <h1
                    className="
                        text-4xl
                        lg:text-5xl
                        font-black
                        mb-4
                    "
                >
                    📁 Annuaire SEO des entreprises
                </h1>

                <p
                    className="
                        text-gray-500
                        text-lg
                        max-w-3xl
                        mx-auto
                        mb-6
                    "
                >
                    Découvrez les meilleurs{" "}
                    {keywordLabel} à {cityLabel} référencés
                    dans notre annuaire SEO professionnel.
                </p>

                <Link
                    to={`/${lang}/annuaire`}
                    className="text-indigo-600 font-semibold"
                >
                    ← Retour à l'annuaire
                </Link>
            </div>

            {/* ========================= */}
            {/* SEO CONTENT */}
            {/* ========================= */}
            {loading ? (
                <p className="text-gray-500 mb-6">
                    Chargement...
                </p>
            ) : seoPage?.content ? (
                <div
                    className="
                        text-gray-700
                        mb-6
                        space-y-4
                    "
                    dangerouslySetInnerHTML={{
                        __html: seoPage.content.replace(
                            /<script.*?>.*?<\/script>/gi,
                            ""
                        )
                    }}
                />
            ) : (
                <p className="text-red-500 mb-6">
                    Contenu SEO indisponible
                </p>
            )}

            {/* ========================= */}
            {/* SEO DATA */}
            {/* ========================= */}
            {seoPage && (
                <div
                    className="
                        bg-green-50
                        p-4
                        rounded-xl
                        mb-6
                        space-y-2
                    "
                >
                    <p>
                        💰 Potentiel estimé :{" "}
                        <strong>
                            {seoPage.revenue
                                ? `${Number(
                                    seoPage.revenue
                                ).toLocaleString()}€ / mois`
                                : "Non estimé"}
                        </strong>
                    </p>

                    <p>
                        ⚔️ Concurrence :{" "}
                        <strong>
                            {seoPage.competition
                                ? `${seoPage.competition}/100`
                                : "Non disponible"}
                        </strong>
                    </p>
                </div>
            )}

            {/* ========================= */}
            {/* LISTING */}
            {/* ========================= */}
            {!loading && profiles.length === 0 && (
                <div
                    className="
                        bg-gray-100
                        p-4
                        rounded-xl
                        mb-8
                        text-center
                    "
                >
                    Aucun professionnel trouvé pour{" "}
                    {keywordLabel} à {cityLabel}
                </div>
            )}

            {profiles.length > 0 && (
                <div className="space-y-4 mb-10">
                    <h2 className="text-2xl font-bold">
                        🔝 Meilleurs professionnels à{" "}
                        {cityLabel}
                    </h2>

                    {profiles.map((p, i) => (
                        <div
                            key={p.id || i}
                            className="
                                bg-white
                                p-4
                                rounded-xl
                                shadow
                                border
                                border-gray-100
                            "
                        >
                            <h3 className="font-semibold text-lg">
                                {p.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                                📍 {p.city}
                            </p>

                            {p.keyword && (
                                <p className="text-sm text-indigo-600">
                                    🔎 {p.keyword}
                                </p>
                            )}

                            {p.description && (
                                <p className="text-gray-700 mt-2">
                                    {p.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ========================= */}
            {/* CTA */}
            {/* ========================= */}
            <div
                className="
                    bg-indigo-50
                    p-6
                    rounded-xl
                    mb-10
                    text-center
                "
            >
                <p className="font-semibold mb-2">
                    🚀 Recevez des clients grâce au SEO
                </p>

                <p className="text-gray-600 mb-5">
                    Référencez votre entreprise dans notre annuaire
                    professionnel.
                </p>

                <Link
                    to={`/${lang}/register`}
                    className="
                        inline-block
                        bg-indigo-600
                        text-white
                        px-5
                        py-3
                        rounded-xl
                        font-semibold
                    "
                >
                    🚀 S'inscrire gratuitement
                </Link>
            </div>
        </div>
    );
}