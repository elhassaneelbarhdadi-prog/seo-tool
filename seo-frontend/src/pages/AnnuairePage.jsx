import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config";

/* =========================================================
   🔥 CLEAN KEYWORD
========================================================= */

const cleanKeyword = (str = "") => {
    return String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^(a|à|de|d'|du|des)\s+/i, "")
        .trim()
        .replace(/\s+/g, " ");
};

/* =========================================================
   🔤 FORMAT
========================================================= */

const capitalize = (str = "") => {
    const value = String(str).trim();

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
};

/* =========================================================
   🔗 CREATE URL SLUG
========================================================= */

const toSlug = (str = "") =>
    String(str)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/* =========================================================
   🌐 BASE URL SEO
========================================================= */

const SITE_URL = "https://www.referenciaseo.com";

/* =========================================================
   🧹 ESCAPE HTML
========================================================= */

const escapeHtml = (str = "") =>
    String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

/* =========================================================
   🛡️ SANITIZE HTML
========================================================= */

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

/* =========================================================
   📝 SEO CONTENT RENDERER
========================================================= */

const renderSeoContent = (rawContent = "") => {
    let content = String(rawContent || "").trim();

    if (!content) {
        return "";
    }

    /* ---------------------------------------------------------
       NORMALISATION MARKDOWN
    --------------------------------------------------------- */

    content = content.replace(
        /\\+(?=[*_#])/g,
        ""
    );

    content = content
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n");

    /* ---------------------------------------------------------
       HTML EXISTANT
    --------------------------------------------------------- */

    const looksLikeHtml =
        /<\s*(h[1-6]|p|div|section|article|ul|ol|li|strong|em|br)\b/i.test(
            content
        );

    if (looksLikeHtml) {
        return sanitizeHtml(content);
    }

    /* ---------------------------------------------------------
       ESCAPE HTML
    --------------------------------------------------------- */

    content = escapeHtml(content);

    /* ---------------------------------------------------------
       NORMALISATION DES TITRES
    --------------------------------------------------------- */

    content = content.replace(
        /\s+(#{1,3})\s+/g,
        "\n$1 "
    );

    const lines = content.split("\n");

    const blocks = [];

    let paragraph = [];
    let unorderedList = [];
    let orderedList = [];

    /* ---------------------------------------------------------
       FORMATAGE INLINE
    --------------------------------------------------------- */

    const formatInline = (text = "") => {
        return String(text)
            .replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>"
            )
            .replace(
                /__(.+?)__/g,
                "<strong>$1</strong>"
            );
    };

    /* ---------------------------------------------------------
       FLUSH PARAGRAPHE
    --------------------------------------------------------- */

    const flushParagraph = () => {
        if (!paragraph.length) {
            return;
        }

        const value = paragraph
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

    /* ---------------------------------------------------------
       FLUSH LISTE À PUCES
    --------------------------------------------------------- */

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

    /* ---------------------------------------------------------
       FLUSH LISTE NUMÉROTÉE
    --------------------------------------------------------- */

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

    /* ---------------------------------------------------------
       PARCOURS DU CONTENU
    --------------------------------------------------------- */

    for (const line of lines) {
        const current = line.trim();

        if (!current) {
            flushParagraph();
            flushLists();
            continue;
        }

        /* -----------------------------------------------------
           LISTE À PUCES
        ----------------------------------------------------- */

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

        /* -----------------------------------------------------
           LISTE NUMÉROTÉE
        ----------------------------------------------------- */

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

        /* -----------------------------------------------------
           TITRES
        ----------------------------------------------------- */

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

        paragraph.push(current);
    }

    flushParagraph();
    flushLists();

    return blocks.join("\n");
};

/* =========================================================
   🧹 CLEAN TEXT FOR DESCRIPTION
========================================================= */

const stripHtml = (html = "") => {
    return String(html)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

/* =========================================================
   ✂️ SEO DESCRIPTION
========================================================= */

const buildDescription = (
    keyword = "",
    city = "",
    seoContent = ""
) => {
    const cleanKeywordLabel = capitalize(keyword);
    const cleanCityLabel = capitalize(city);

    const fallback =
        `Trouvez des ${cleanKeywordLabel} à ${cleanCityLabel} : entreprises, professionnels et informations utiles dans l'annuaire Référencia SEO.`;

    const contentText = stripHtml(seoContent);

    if (!contentText) {
        return fallback;
    }

    /*
     * On préfère une description contrôlée plutôt que
     * de prendre arbitrairement les 155 premiers caractères
     * du contenu généré.
     */

    const description =
        `${cleanKeywordLabel} à ${cleanCityLabel} : découvrez les professionnels et entreprises référencés dans l'annuaire Référencia SEO.`;

    return description.slice(0, 160);
};

/* =========================================================
   📊 JSON-LD COLLECTION PAGE
========================================================= */

const buildCollectionSchema = ({
    url,
    title,
    description,
    keyword,
    city,
    profiles = []
}) => {
    const itemList = profiles
        .filter(Boolean)
        .slice(0, 20)
        .map((profile, index) => {
            const profileSlug =
                `${toSlug(profile.keyword || keyword)}-${toSlug(
                    profile.city || city
                )}`;

            return {
                "@type": "ListItem",
                position: index + 1,
                name:
                    profile.name ||
                    `${capitalize(
                        profile.keyword || keyword
                    )} à ${capitalize(
                        profile.city || city
                    )}`,
                url: `${SITE_URL}/fr/annuaire/${profileSlug}`
            };
        });

    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url,
        about: {
            "@type": "Thing",
            name: `${capitalize(keyword)} à ${capitalize(city)}`
        },
        ...(itemList.length > 0
            ? {
                mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: itemList.length,
                    itemListElement: itemList
                }
            }
            : {})
    };
};

/* =========================================================
   🍞 BREADCRUMB JSON-LD
========================================================= */

const buildBreadcrumbSchema = ({
    lang,
    keyword,
    city,
    slug
}) => {
    const items = [
        {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: `${SITE_URL}/${lang}/`
        },
        {
            "@type": "ListItem",
            position: 2,
            name: "Annuaire SEO",
            item: `${SITE_URL}/${lang}/annuaire`
        },
        {
            "@type": "ListItem",
            position: 3,
            name: `${capitalize(keyword)} à ${capitalize(city)}`,
            item: `${SITE_URL}/${lang}/annuaire/${slug}`
        }
    ];

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items
    };
};

/* =========================================================
   📁 ANNUAIRE PAGE
========================================================= */

export default function AnnuairePage() {
    const {
        slug,
        lang = "fr"
    } = useParams();

    /* ---------------------------------------------------------
       STATES
    --------------------------------------------------------- */

    const [profiles, setProfiles] = useState([]);

    const [seoPage, setSeoPage] = useState(null);

    const [seoPages, setSeoPages] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [notFound, setNotFound] = useState(false);

    /* ---------------------------------------------------------
       ROUTE INFORMATION
       
       Important :
       On ne considère plus automatiquement le dernier mot
       du slug comme étant la ville.
       
       Le backend reste la source prioritaire pour connaître
       le vrai keyword et la vraie ville.
    --------------------------------------------------------- */

    const {
        routeKeyword,
        routeCity
    } = useMemo(() => {
        if (!slug) {
            return {
                routeKeyword: "",
                routeCity: ""
            };
        }

        const parts = String(slug)
            .split("-")
            .filter(Boolean);

        if (parts.length < 2) {
            return {
                routeKeyword: "",
                routeCity: ""
            };
        }

        /*
         * Fallback uniquement.
         *
         * Le vrai keyword/city sera récupéré depuis
         * seoPage lorsque le backend répond.
         */

        return {
            routeKeyword: cleanKeyword(
                parts
                    .slice(0, -1)
                    .join(" ")
            ),
            routeCity: parts
                .slice(-1)
                .join("-")
        };
    }, [slug]);

    const isDirectoryHome = !slug;

    const isInvalidSlug =
        Boolean(slug) &&
        (!routeKeyword || !routeCity);

    /* =========================================================
       🔥 LOAD DATA
    ========================================================= */

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");
                setNotFound(false);

                /* =================================================
                   🏠 PAGE D'ACCUEIL ANNUAIRE
                ================================================= */

                if (isDirectoryHome) {
                    const [
                        profilesRes,
                        seoPagesRes
                    ] = await Promise.all([
                        fetch(
                            `${API_BASE}/business-profile`
                        ),
                        fetch(
                            `${API_BASE}/seo-page/directory-pages?limit=30`
                        )
                    ]);

                    let profilesData = null;
                    let seoPagesData = null;

                    try {
                        profilesData =
                            await profilesRes.json();
                    } catch {
                        throw new Error(
                            "Réponse business invalide"
                        );
                    }

                    try {
                        seoPagesData =
                            await seoPagesRes.json();
                    } catch {
                        seoPagesData = null;
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

                    if (
                        seoPagesRes.ok &&
                        Array.isArray(
                            seoPagesData?.pages
                        )
                    ) {
                        setSeoPages(
                            seoPagesData.pages
                        );
                    } else {
                        setSeoPages([]);
                    }

                    setSeoPage(null);

                    return;
                }

                /* =================================================
                   ❌ SLUG INVALIDE
                ================================================= */

                if (isInvalidSlug) {
                    setNotFound(true);
                    return;
                }

                /* =================================================
                   🔎 PAGE SEO MÉTIER + VILLE
                ================================================= */

                const [
                    seoRes,
                    profilesRes,
                    seoPagesRes
                ] = await Promise.all([
                    fetch(
                        `${API_BASE}/seo-page?slug=${encodeURIComponent(
                            slug
                        )}`
                    ),

                    fetch(
                        `${API_BASE}/business-profile`
                    ),

                    fetch(
                        `${API_BASE}/seo-page/directory-pages?limit=30`
                    )
                ]);

                let seoData = null;
                let profilesData = null;
                let seoPagesData = null;

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

                try {
                    seoPagesData =
                        await seoPagesRes.json();
                } catch {
                    seoPagesData = null;
                }

                /* -------------------------------------------------
                   SEO PAGE 404
                ------------------------------------------------- */

                if (!seoRes.ok) {
                    if (seoRes.status === 404) {
                        setNotFound(true);
                        return;
                    }

                    throw new Error(
                        seoData?.error ||
                        `SEO PAGE ERROR ${seoRes.status}`
                    );
                }

                /* -------------------------------------------------
                   BUSINESS ERROR
                ------------------------------------------------- */

                if (!profilesRes.ok) {
                    throw new Error(
                        profilesData?.error ||
                        `BUSINESS PROFILE ERROR ${profilesRes.status}`
                    );
                }

                if (cancelled) {
                    return;
                }

                /* -------------------------------------------------
                   STORE SEO PAGE
                ------------------------------------------------- */

                setSeoPage(seoData);

                /* -------------------------------------------------
                   STORE OTHER SEO PAGES
                ------------------------------------------------- */

                if (
                    seoPagesRes.ok &&
                    Array.isArray(
                        seoPagesData?.pages
                    )
                ) {
                    setSeoPages(
                        seoPagesData.pages
                    );
                } else {
                    setSeoPages([]);
                }

                /* -------------------------------------------------
                   🔥 GET REAL KEYWORD + CITY
                   
                   Priority :
                   1. backend seoPage
                   2. fallback route parsing
                ------------------------------------------------- */

                const backendKeyword =
                    cleanKeyword(
                        seoData?.keyword ||
                        seoData?.keywords ||
                        routeKeyword
                    );

                const backendCity =
                    String(
                        seoData?.city ||
                        routeCity ||
                        ""
                    )
                        .trim()
                        .toLowerCase();

                /* -------------------------------------------------
                   FILTER BUSINESS PROFILES
                ------------------------------------------------- */

                if (
                    Array.isArray(
                        profilesData?.businesses
                    )
                ) {
                    const filtered =
                        profilesData.businesses.filter(
                            (p) => {
                                const profileKeyword =
                                    cleanKeyword(
                                        p?.keyword || ""
                                    );

                                const profileCity =
                                    String(
                                        p?.city || ""
                                    )
                                        .trim()
                                        .toLowerCase();

                                const keywordMatch =
                                    profileKeyword.includes(
                                        backendKeyword
                                    ) ||
                                    backendKeyword.includes(
                                        profileKeyword
                                    );

                                const cityMatch =
                                    profileCity ===
                                    backendCity ||
                                    profileCity.includes(
                                        backendCity
                                    ) ||
                                    backendCity.includes(
                                        profileCity
                                    );

                                return (
                                    keywordMatch &&
                                    cityMatch
                                );
                            }
                        );

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
        routeKeyword,
        routeCity,
        isDirectoryHome,
        isInvalidSlug
    ]);

    /* =========================================================
       ❌ PAGE INVALIDE
    ========================================================= */

    if (isInvalidSlug || notFound) {
        const invalidCanonical =
            `${SITE_URL}/${lang}/annuaire`;

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

                    <meta
                        name="robots"
                        content="noindex, nofollow"
                    />

                    <link
                        rel="canonical"
                        href={invalidCanonical}
                    />
                </Helmet>

                <div className="max-w-4xl mx-auto p-10 text-center">
                    <h1 className="text-3xl font-bold mb-4">
                        Page annuaire introuvable
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Cette page annuaire n'existe pas
                        ou l'adresse est incorrecte.
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

    /* =========================================================
       🏠 PAGE D'ACCUEIL ANNUAIRE
    ========================================================= */

    if (isDirectoryHome) {
        const directoryCanonical =
            `${SITE_URL}/${lang}/annuaire`;

        const directoryTitle =
            "Annuaire SEO des entreprises et professionnels | Référencia SEO";

        const directoryDescription =
            "Trouvez des entreprises et des professionnels par activité et par ville dans l'annuaire SEO Référencia SEO.";

        const directorySchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: directoryTitle,
            description: directoryDescription,
            url: directoryCanonical
        };

        return (
            <div className="max-w-6xl mx-auto p-6 lg:p-10">
                <Helmet>
                    <title>
                        {directoryTitle}
                    </title>

                    <meta
                        name="description"
                        content={directoryDescription}
                    />

                    <meta
                        name="robots"
                        content="index, follow"
                    />

                    <link
                        rel="canonical"
                        href={directoryCanonical}
                    />

                    <script type="application/ld+json">
                        {JSON.stringify(
                            directorySchema
                        )}
                    </script>
                </Helmet>

                {/* =================================================
                   HERO
                ================================================= */}

                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-black mb-5">
                        📁 Annuaire SEO des entreprises
                    </h1>

                    <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-8">
                        Trouvez des entreprises et des
                        professionnels référencés dans
                        notre annuaire SEO par activité
                        et par ville.
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

                {/* =================================================
                   ERROR
                ================================================= */}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-8">
                        {error}
                    </div>
                )}

                {/* =================================================
                   ENTREPRISES
                ================================================= */}

                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">
                            🔝 Professionnels référencés
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Découvrez les entreprises et
                            professionnels présents dans
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
                        <div className="bg-gray-100 p-8 rounded-xl text-center">
                            <p className="text-gray-600 mb-4">
                                Aucun professionnel n'est
                                encore référencé dans
                                l'annuaire.
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
                            {profiles.map(
                                (p, i) => {
                                    const profileSlug =
                                        `${toSlug(
                                            p.keyword
                                        )}-${toSlug(
                                            p.city
                                        )}`;

                                    return (
                                        <div
                                            key={
                                                p.id ||
                                                profileSlug ||
                                                i
                                            }
                                            className="bg-white p-6 rounded-xl shadow border border-gray-100"
                                        >
                                            <h3 className="font-bold text-xl mb-2">
                                                <Link
                                                    to={`/${lang}/annuaire/${profileSlug}`}
                                                    className="text-indigo-700 hover:underline"
                                                >
                                                    {p.name ||
                                                        "Entreprise"}
                                                </Link>
                                            </h3>

                                            {p.keyword && (
                                                <p className="text-sm text-indigo-600 mb-2">
                                                    🔎{" "}
                                                    <Link
                                                        to={`/${lang}/annuaire/${profileSlug}`}
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
                                                        to={`/${lang}/annuaire/${profileSlug}`}
                                                        className="hover:underline"
                                                    >
                                                        {p.city}
                                                    </Link>
                                                </p>
                                            )}

                                            {p.description && (
                                                <p className="text-gray-700">
                                                    {
                                                        p.description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                {/* =================================================
                   PAGES SEO LOCALES
                ================================================= */}

                {seoPages.length > 0 && (
                    <section className="mt-12">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">
                                🔎 Pages SEO locales
                            </h2>

                            <p className="text-gray-500 mt-2">
                                Explorez les pages dédiées
                                aux différentes activités
                                et villes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {seoPages.map(
                                (page, i) => {
                                    if (
                                        !page?.slug
                                    ) {
                                        return null;
                                    }

                                    return (
                                        <Link
                                            key={
                                                page.slug ||
                                                i
                                            }
                                            to={`/${lang}/annuaire/${page.slug}`}
                                            className="block bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition"
                                        >
                                            <h3 className="font-semibold text-indigo-700">
                                                {capitalize(
                                                    page.keyword
                                                )}{" "}
                                                à{" "}
                                                {capitalize(
                                                    page.city
                                                )}
                                            </h3>

                                            <p className="text-sm text-gray-500 mt-1">
                                                Voir la page SEO locale →
                                            </p>
                                        </Link>
                                    );
                                }
                            )}
                        </div>
                    </section>
                )}

                {/* =================================================
                   CTA
                ================================================= */}

                <div className="bg-indigo-50 p-8 rounded-2xl mt-12 text-center">
                    <h2 className="text-2xl font-bold mb-3">
                        🚀 Développez votre visibilité sur Google
                    </h2>

                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Référencez votre entreprise dans
                        notre annuaire professionnel et
                        présentez vos services à vos futurs
                        clients.
                    </p>

                    <Link
                        to={`/${lang}/register`}
                        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
                    >
                        S'inscrire gratuitement
                    </Link>
                </div>
            </div>
        );
    }

    /* =========================================================
       🔎 PAGE SEO MÉTIER + VILLE
    ========================================================= */

    /*
     * Le backend est prioritaire pour le keyword et la ville.
     * Le fallback du slug est utilisé seulement si le backend
     * ne les renvoie pas.
     */

    const keyword =
        cleanKeyword(
            seoPage?.keyword ||
            seoPage?.keywords ||
            routeKeyword
        );

    const city =
        String(
            seoPage?.city ||
            routeCity ||
            ""
        )
            .trim()
            .toLowerCase();

    const keywordLabel =
        capitalize(keyword);

    const cityLabel =
        capitalize(city);

    /* =========================================================
       TITLE
    ========================================================= */

    const title =
        `${keywordLabel} à ${cityLabel} : entreprises et professionnels | Référencia SEO`;

    /* =========================================================
       DESCRIPTION
    ========================================================= */

    const description =
        buildDescription(
            keyword,
            city,
            seoPage?.content || ""
        );

    /* =========================================================
       CANONICAL
    ========================================================= */

    const canonicalUrl =
        `${SITE_URL}/${lang}/annuaire/${slug}`;

    /* =========================================================
       CONTENU SEO
    ========================================================= */

    const renderedSeoContent =
        seoPage?.content
            ? renderSeoContent(
                seoPage.content
            )
            : "";

    const plainSeoContent =
        stripHtml(
            seoPage?.content || ""
        );

    /* =========================================================
       PAGE VALUE
       
       Une page locale sans professionnel et sans contenu
       substantiel ne doit pas être poussée à l'index.
    ========================================================= */

    const hasProfessionals =
        profiles.length > 0;

    const hasUsefulSeoContent =
        plainSeoContent.length >= 600;

    const shouldIndex =
        hasProfessionals &&
        hasUsefulSeoContent;

    /* =========================================================
       RELATED SEO PAGES
    ========================================================= */

    const normalizeCity = (value = "") =>
        String(value)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

    const relatedSeoPages =
        seoPages
            .filter((page) => {
                if (!page?.slug) {
                    return false;
                }

                if (
                    page.slug === slug
                ) {
                    return false;
                }

                return (
                    normalizeCity(
                        page.city || ""
                    ) ===
                    normalizeCity(
                        city
                    )
                );
            })
            .filter(
                (page, index, array) =>
                    array.findIndex(
                        (item) =>
                            item.slug ===
                            page.slug
                    ) === index
            )
            .slice(0, 6);

    /* =========================================================
       JSON-LD
    ========================================================= */

    const collectionSchema =
        buildCollectionSchema({
            url: canonicalUrl,
            title,
            description,
            keyword,
            city,
            profiles
        });

    const breadcrumbSchema =
        buildBreadcrumbSchema({
            lang,
            keyword,
            city,
            slug
        });

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
            <Helmet>
                {/* -------------------------------------------------
                   TITLE
                ------------------------------------------------- */}

                <title>
                    {title}
                </title>

                {/* -------------------------------------------------
                   DESCRIPTION
                ------------------------------------------------- */}

                <meta
                    name="description"
                    content={description}
                />

                {/* -------------------------------------------------
                   ROBOTS
                   
                   Important :
                   page locale sans professionnel
                   => noindex
                ------------------------------------------------- */}

                <meta
                    name="robots"
                    content={
                        shouldIndex
                            ? "index, follow"
                            : "noindex, follow"
                    }
                />

                {/* -------------------------------------------------
                   CANONICAL
                ------------------------------------------------- */}

                <link
                    rel="canonical"
                    href={canonicalUrl}
                />

                {/* -------------------------------------------------
                   JSON-LD COLLECTION
                ------------------------------------------------- */}

                <script type="application/ld+json">
                    {JSON.stringify(
                        collectionSchema
                    )}
                </script>

                {/* -------------------------------------------------
                   JSON-LD BREADCRUMB
                ------------------------------------------------- */}

                <script type="application/ld+json">
                    {JSON.stringify(
                        breadcrumbSchema
                    )}
                </script>
            </Helmet>

            {/* =====================================================
               NOTICE PAGE NON INDEXABLE
            ===================================================== */}

            {!loading &&
                !shouldIndex && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6 text-sm">
                        Cette page est actuellement
                        conservée hors de l'index Google
                        car elle ne contient pas encore
                        suffisamment d'informations
                        locales.
                    </div>
                )}

            {/* =====================================================
               ERROR
            ===================================================== */}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {/* =====================================================
               HEADER
            ===================================================== */}

            <div className="text-center mb-10">
                <h1 className="text-4xl lg:text-5xl font-black mb-4">
                    {keywordLabel} à {cityLabel}
                </h1>

                <p className="text-gray-500 text-lg max-w-3xl mx-auto mb-6">
                    {profiles.length > 0
                        ? `Découvrez les entreprises et professionnels liés à l'activité « ${keyword} » à ${cityLabel} référencés dans notre annuaire SEO.`
                        : `Découvrez les informations et professionnels liés à l'activité « ${keyword} » à ${cityLabel} dans notre annuaire SEO.`}
                </p>

                <Link
                    to={`/${lang}/annuaire`}
                    className="text-indigo-600 font-semibold hover:underline"
                >
                    ← Retour à l'annuaire
                </Link>
            </div>

            {/* =====================================================
               SEO CONTENT
            ===================================================== */}

            {loading ? (
                <p className="text-gray-500 mb-6">
                    Chargement...
                </p>
            ) : renderedSeoContent ? (
                <article
                    className="
                        text-gray-700
                        mb-8
                        space-y-4
                        leading-7
                    "
                    dangerouslySetInnerHTML={{
                        __html:
                            renderedSeoContent
                    }}
                />
            ) : (
                <div className="bg-gray-100 p-6 rounded-xl mb-8 text-center">
                    <p className="text-gray-600">
                        Les informations SEO de cette
                        page ne sont pas encore
                        disponibles.
                    </p>
                </div>
            )}

            {/* =====================================================
               SEO DATA
            ===================================================== */}

            {seoPage && (
                <div className="bg-green-50 p-4 rounded-xl mb-8 space-y-2">
                    <p>
                        💰 Potentiel estimé :{" "}
                        <strong>
                            {seoPage.revenue
                                ? `${Number(
                                    seoPage.revenue
                                ).toLocaleString(
                                    "fr-FR"
                                )} € / mois`
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

            {/* =====================================================
               EMPTY DIRECTORY
            ===================================================== */}

            {!loading &&
                profiles.length === 0 && (
                    <div className="bg-gray-100 p-6 rounded-xl mb-8 text-center">
                        <h2 className="text-xl font-bold mb-2">
                            Aucun professionnel référencé
                        </h2>

                        <p className="text-gray-600 mb-5">
                            Aucun professionnel n'est
                            actuellement référencé pour{" "}
                            <strong>
                                {keywordLabel}
                            </strong>{" "}
                            à{" "}
                            <strong>
                                {cityLabel}
                            </strong>.
                        </p>

                        <Link
                            to={`/${lang}/register`}
                            className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold"
                        >
                            🚀 Référencer mon entreprise
                        </Link>
                    </div>
                )}

            {/* =====================================================
               PROFESSIONALS
            ===================================================== */}

            {profiles.length > 0 && (
                <section className="space-y-4 mb-10">
                    <h2 className="text-2xl font-bold">
                        🔝 Professionnels à{" "}
                        {cityLabel}
                    </h2>

                    {profiles.map(
                        (p, i) => {
                            const profileSlug =
                                `${toSlug(
                                    p.keyword ||
                                    keyword
                                )}-${toSlug(
                                    p.city ||
                                    city
                                )}`;

                            return (
                                <div
                                    key={
                                        p.id ||
                                        profileSlug ||
                                        i
                                    }
                                    className="bg-white p-5 rounded-xl shadow border border-gray-100"
                                >
                                    <h3 className="font-semibold text-lg">
                                        <Link
                                            to={`/${lang}/annuaire/${profileSlug}`}
                                            className="text-indigo-700 hover:underline"
                                        >
                                            {p.name ||
                                                "Entreprise"}
                                        </Link>
                                    </h3>

                                    {p.city && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            📍{" "}
                                            {p.city}
                                        </p>
                                    )}

                                    {p.keyword && (
                                        <p className="text-sm text-indigo-600 mt-1">
                                            🔎{" "}
                                            {p.keyword}
                                        </p>
                                    )}

                                    {p.description && (
                                        <p className="text-gray-700 mt-3">
                                            {
                                                p.description
                                            }
                                        </p>
                                    )}
                                </div>
                            );
                        }
                    )}
                </section>
            )}

            {/* =====================================================
               AUTRES PAGES SEO DE LA VILLE
            ===================================================== */}

            {relatedSeoPages.length > 0 && (
                <section className="mb-10">
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold">
                            🔎 Autres recherches à{" "}
                            {cityLabel}
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Découvrez d'autres activités
                            référencées dans cette ville.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {relatedSeoPages.map(
                            (page) => (
                                <Link
                                    key={page.slug}
                                    to={`/${lang}/annuaire/${page.slug}`}
                                    className="block bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition"
                                >
                                    <h3 className="font-semibold text-indigo-700">
                                        {capitalize(
                                            page.keyword
                                        )}{" "}
                                        à{" "}
                                        {capitalize(
                                            page.city
                                        )}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Voir la page SEO locale →
                                    </p>
                                </Link>
                            )
                        )}
                    </div>
                </section>
            )}

            {/* =====================================================
               CTA
            ===================================================== */}

            <div className="bg-indigo-50 p-6 rounded-xl mb-10 text-center">
                <p className="font-semibold mb-2">
                    🚀 Recevez des clients grâce au SEO
                </p>

                <p className="text-gray-600 mb-5">
                    Référencez votre entreprise dans
                    notre annuaire professionnel.
                </p>

                <Link
                    to={`/${lang}/register`}
                    className="inline-block bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold"
                >
                    🚀 S'inscrire gratuitement
                </Link>
            </div>
        </div>
    );
}