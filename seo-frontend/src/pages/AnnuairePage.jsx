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
    str
        ? str.charAt(0).toUpperCase() + str.slice(1)
        : "";

/* ========================= */
/* 🔗 CREATE URL SLUG */
/* ========================= */

const toSlug = (str = "") =>
    String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/* ========================= */
/* 🧹 SEO CONTENT RENDERER */
/* ========================= */

/*
 * Le backend peut retourner :
 * - du HTML
 * - du Markdown généré par l'IA
 *   (#, ##, ###, **gras**, listes)
 *
 * Cette fonction transforme le contenu
 * en HTML propre et sécurisé.
 */

const escapeHtml = (str = "") =>
    String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const sanitizeHtml = (html = "") =>
    String(html)
        .replace(
            /<script\b[^>]*>[\s\S]*?<\/script>/gi,
            ""
        )
        .replace(
            /\son\w+\s*=\s*(['"]).*?\1/gi,
            ""
        )
        .replace(
            /\son\w+\s*=\s*[^\s>]+/gi,
            ""
        )
        .replace(
            /javascript\s*:/gi,
            ""
        );

const renderSeoContent = (rawContent = "") => {
    let content = String(rawContent || "").trim();

    if (!content) {
        return "";
    }

    /*
     * =========================
     * NORMALISATION MARKDOWN
     * =========================
     *
     * Corrige les caractères d'échappement
     * parfois présents dans les contenus.
     *
     * Exemple :
     * \*\*texte\*\*
     * devient :
     * **texte**
     */

    content = content.replace(
        /\\+(?=[*_#])/g,
        ""
    );

    /*
     * Transforme les retours à la ligne
     * enregistrés littéralement.
     */
    content = content
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n");

    /*
     * =========================
     * HTML EXISTANT
     * =========================
     */

    const looksLikeHtml =
        /<\s*(h[1-6]|p|div|section|article|ul|ol|li|strong|em|br)\b/i.test(
            content
        );

    if (looksLikeHtml) {
        return sanitizeHtml(content);
    }

    /*
     * =========================
     * ESCAPE HTML
     * =========================
     */

    content = escapeHtml(content);

    /*
     * =========================
     * SÉPARATION DES TITRES
     * =========================
     */

    content = content.replace(
        /\s+(#{1,3})\s+/g,
        "\n$1 "
    );

    const lines = content.split("\n");

    const blocks = [];

    let paragraph = [];
    let unorderedList = [];
    let orderedList = [];

    /*
     * =========================
     * FORMATAGE INLINE
     * =========================
     */

    const formatInline = (text = "") => {
        return text
            .replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            )
            .replace(
                /__(.+?)__/g,
                "<strong>$1</strong>"
            );
    };

    /*
     * =========================
     * FLUSH PARAGRAPHE
     * =========================
     */

    const flushParagraph = () => {
        if (!paragraph.length) {
            return;
        }

        const value =
            paragraph
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();

        if (value) {
            blocks.push(
                `<p>${formatInline(value)}</p>`
            );
        }

        paragraph = [];
    };

    /*
     * =========================
     * FLUSH LISTE À PUCES
     * =========================
     */

    const flushUnorderedList = () => {
        if (!unorderedList.length) {
            return;
        }

        blocks.push(
            `<ul class="list-disc pl-6 space-y-1">${unorderedList
                .map(
                    (item) =>
                        `<li>${formatInline(item)}</li>`
                )
                .join("")}</ul>`
        );

        unorderedList = [];
    };

    /*
     * =========================
     * FLUSH LISTE NUMÉROTÉE
     * =========================
     */

    const flushOrderedList = () => {
        if (!orderedList.length) {
            return;
        }

        blocks.push(
            `<ol class="list-decimal pl-6 space-y-1">${orderedList
                .map(
                    (item) =>
                        `<li>${formatInline(item)}</li>`
                )
                .join("")}</ol>`
        );

        orderedList = [];
    };

    const flushLists = () => {
        flushUnorderedList();
        flushOrderedList();
    };

    /*
     * =========================
     * PARCOURS DU CONTENU
     * =========================
     */

    for (const line of lines) {
        const current = line.trim();

        /*
         * Ligne vide
         */
        if (!current) {
            flushParagraph();
            flushLists();
            continue;
        }

        /*
         * =========================
         * LISTE À PUCES
         * =========================
         */

        const unorderedMatch =
            current.match(/^[-*]\s+(.+)$/);

        if (unorderedMatch) {
            flushParagraph();
            flushOrderedList();

            unorderedList.push(
                unorderedMatch[1].trim()
            );

            continue;
        }

        /*
         * =========================
         * LISTE NUMÉROTÉE
         * =========================
         */

        const orderedMatch =
            current.match(/^\d+\.\s+(.+)$/);

        if (orderedMatch) {
            flushParagraph();
            flushUnorderedList();

            orderedList.push(
                orderedMatch[1].trim()
            );

            continue;
        }

        /*
         * =========================
         * TITRES
         * =========================
         */

        const h3 =
            current.match(/^###\s+(.+)$/);

        const h2 =
            current.match(/^##\s+(.+)$/);

        const h1 =
            current.match(/^#\s+(.+)$/);

        if (h3) {
            flushParagraph();
            flushLists();

            blocks.push(
                `<h3>${formatInline(
                    h3[1].trim()
                )}</h3>`
            );

            continue;
        }

        if (h2) {
            flushParagraph();
            flushLists();

            blocks.push(
                `<h2>${formatInline(
                    h2[1].trim()
                )}</h2>`
            );

            continue;
        }

        if (h1) {
            flushParagraph();
            flushLists();

            /*
             * Le H1 principal est déjà présent
             * dans la page.
             *
             * Un éventuel H1 généré par l'IA
             * devient donc un H2.
             */
            blocks.push(
                `<h2>${formatInline(
                    h1[1].trim()
                )}</h2>`
            );

            continue;
        }

        /*
         * =========================
         * PARAGRAPHE
         * =========================
         */

        paragraph.push(current);
    }

    /*
     * =========================
     * FIN
     * =========================
     */

    flushParagraph();
    flushLists();

    return blocks.join("\n");
};

/* ========================= */
/* 📁 ANNUAIRE PAGE */
/* ========================= */

export default function AnnuairePage() {
    const {
        slug,
        lang = "fr"
    } = useParams();

    const [profiles, setProfiles] =
        useState([]);

    const [seoPage, setSeoPage] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /* ========================= */
    /* 🔐 PARSE SLUG */
    /* ========================= */

    const {
        keyword,
        city
    } = useMemo(() => {

        /*
         * /fr/annuaire n'a pas de slug.
         * C'est la page d'accueil publique.
         */

        if (!slug) {
            return {
                keyword: "",
                city: ""
            };
        }

        const parts =
            slug
                .split("-")
                .filter(Boolean);

        if (parts.length < 2) {
            return {
                keyword: "",
                city: ""
            };
        }

        return {
            keyword:
                cleanKeyword(
                    parts
                        .slice(0, -1)
                        .join(" ")
                ),

            city:
                parts
                    .slice(-1)
                    .join("-")
        };
    }, [slug]);

    const isDirectoryHome =
        !slug;

    const isInvalidSlug =
        Boolean(slug) &&
        (!keyword || !city);

    const keywordLabel =
        capitalize(keyword);

    const cityLabel =
        capitalize(city);

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
                 * PAGE D'ACCUEIL ANNUAIRE
                 * =========================
                 */

                if (isDirectoryHome) {
                    const profilesRes =
                        await fetch(
                            `${API_BASE}/business-profile`
                        );

                    let profilesData =
                        null;

                    try {
                        profilesData =
                            await profilesRes.json();
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

                    if (cancelled) {
                        return;
                    }

                    if (
                        Array.isArray(
                            profilesData?.businesses
                        )
                    ) {
                        setProfiles(
                            profilesData.businesses
                        );
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

                const [
                    seoRes,
                    profilesRes
                ] =
                    await Promise.all([
                        fetch(
                            `${API_BASE}/seo-page?slug=${encodeURIComponent(
                                slug
                            )}`
                        ),

                        fetch(
                            `${API_BASE}/business-profile`
                        )
                    ]);

                let seoData = null;
                let profilesData = null;

                try {
                    seoData =
                        await seoRes.json();
                } catch {
                    throw new Error(
                        "Réponse SEO invalide"
                    );
                }

                try {
                    profilesData =
                        await profilesRes.json();
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

                if (cancelled) {
                    return;
                }

                setSeoPage(seoData);

                if (
                    Array.isArray(
                        profilesData?.businesses
                    )
                ) {
                    const filtered =
                        profilesData.businesses.filter(
                            (p) => {
                                const k =
                                    cleanKeyword(
                                        p?.keyword || ""
                                    );

                                const c =
                                    (
                                        p?.city || ""
                                    ).toLowerCase();

                                return (
                                    (
                                        k.includes(
                                            keyword
                                        ) ||
                                        keyword.includes(
                                            k
                                        )
                                    ) &&
                                    c.includes(
                                        city.toLowerCase()
                                    )
                                );
                            }
                        );

                    setProfiles(
                        filtered
                    );
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
                                    key={
                                        p.id || i
                                    }
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

                                        <Link
                                            to={`/${lang}/annuaire/${toSlug(
                                                p.keyword
                                            )}-${toSlug(
                                                p.city
                                            )}`}
                                            className="text-indigo-700 hover:underline"
                                        >
                                            {p.name || "Entreprise"}
                                        </Link>

                                    </h3>

                                    {p.keyword && (

                                        <p className="text-sm text-indigo-600 mb-2">
                                            🔎{" "}

                                            <Link
                                                to={`/${lang}/annuaire/${toSlug(
                                                    p.keyword
                                                )}-${toSlug(
                                                    p.city
                                                )}`}
                                                className="hover:underline"
                                            >
                                                {p.keyword}
                                            </Link>
                                        </p>

                                    )}

                                    {p.city && (

                                        <p className="text-sm text-gray-500 mb-3">
                                            📍{" "}

                                            <Link
                                                to={`/${lang}/annuaire/${toSlug(
                                                    p.keyword
                                                )}-${toSlug(
                                                    p.city
                                                )}`}
                                                className="hover:underline"
                                            >
                                                {p.city}
                                            </Link>
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

                <title>
                    {title}
                </title>

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
                    {keywordLabel} à {cityLabel}
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

                    {profiles.length > 0
                        ? `Découvrez les entreprises et professionnels liés à l’activité « ${keyword} » à ${cityLabel} référencés dans notre annuaire SEO.`
                        : `Recherchez des entreprises et professionnels liés à l’activité « ${keyword} » à ${cityLabel} grâce à notre annuaire SEO.`
                    }

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
                        leading-7
                    "
                    dangerouslySetInnerHTML={{
                        __html:
                            renderSeoContent(
                                seoPage.content
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
                                : "Non estimé"
                            }

                        </strong>
                    </p>

                    <p>
                        ⚔️ Concurrence :{" "}

                        <strong>

                            {seoPage.competition
                                ? `${seoPage.competition}/100`
                                : "Non disponible"
                            }

                        </strong>
                    </p>

                </div>

            )}

            {/* ========================= */}
            {/* EMPTY DIRECTORY */}
            {/* ========================= */}

            {!loading &&
                profiles.length === 0 && (

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

            {/* ========================= */}
            {/* PROFESSIONALS */}
            {/* ========================= */}

            {profiles.length > 0 && (

                <div className="space-y-4 mb-10">

                    <h2 className="text-2xl font-bold">
                        🔝 Meilleurs professionnels à{" "}
                        {cityLabel}
                    </h2>

                    {profiles.map((p, i) => (

                        <div
                            key={
                                p.id || i
                            }
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

                                <Link
                                    to={`/${lang}/annuaire/${toSlug(
                                        p.keyword
                                    )}-${toSlug(
                                        p.city
                                    )}`}
                                    className="text-indigo-700 hover:underline"
                                >
                                    {p.name}
                                </Link>

                            </h3>

                            <p className="text-sm text-gray-500">

                                📍{" "}

                                <Link
                                    to={`/${lang}/annuaire/${toSlug(
                                        p.keyword
                                    )}-${toSlug(
                                        p.city
                                    )}`}
                                    className="hover:underline"
                                >
                                    {p.city}
                                </Link>

                            </p>

                            {p.keyword && (

                                <p className="text-sm text-indigo-600">

                                    🔎{" "}

                                    <Link
                                        to={`/${lang}/annuaire/${toSlug(
                                            p.keyword
                                        )}-${toSlug(
                                            p.city
                                        )}`}
                                        className="hover:underline"
                                    >
                                        {p.keyword}
                                    </Link>

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