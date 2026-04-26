import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useEffect, useState, useMemo } from "react";

/* ========================= */
/* 🔥 CLEAN KEYWORD */
/* ========================= */
const cleanKeywordFn = (str = "") => {
    let value = str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    while (/^(a|à|de|d'|du|des)\s+/i.test(value)) {
        value = value.replace(/^(a|à|de|d'|du|des)\s+/i, "").trim();
    }

    return value.replace(/\s+/g, " ");
};

/* ========================= */
/* 🔤 FORMAT */
/* ========================= */
const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

export default function AnnuairePage() {

    const { slug, lang = "fr" } = useParams();

    const [profiles, setProfiles] = useState([]);
    const [seoPage, setSeoPage] = useState(null);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [loadingSeo, setLoadingSeo] = useState(true);
    const [error, setError] = useState("");

    /* ========================= */
    /* 🔐 PARSE SLUG */
    /* ========================= */
    const { keyword, city } = useMemo(() => {

        if (!slug) return { keyword: "", city: "" };

        const parts = slug.split("-").filter(Boolean);

        const cityRaw = parts.pop();
        const rawKeyword = parts.join(" ");

        return {
            keyword: cleanKeywordFn(rawKeyword),
            city: cityRaw?.toLowerCase() || ""
        };

    }, [slug]);

    const isInvalid = !keyword || !city;

    const keywordLabel = capitalize(keyword);
    const cityLabel = capitalize(city);

    /* ========================= */
    /* 🔥 LOAD SEO (SOURCE UNIQUE) */
    /* ========================= */
    useEffect(() => {

        if (isInvalid) return;

        let cancelled = false;

        const loadSeo = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3001/api/seo-page?slug=${slug}`
                );

                const data = await res.json();

                if (!cancelled) {
                    setSeoPage(data);
                    setLoadingSeo(false);
                }

            } catch {
                if (!cancelled) {
                    setSeoPage(null);
                    setLoadingSeo(false);
                }
            }
        };

        loadSeo();

        return () => {
            cancelled = true;
        };

    }, [slug, isInvalid]);

    /* ========================= */
    /* 🔥 LOAD PROFILES */
    /* ========================= */
    useEffect(() => {

        if (isInvalid) return;

        let cancelled = false;

        const loadProfiles = async () => {
            try {
                setLoadingProfiles(true);
                setError("");

                const res = await fetch(
                    "http://localhost:3001/api/business-profile"
                );

                if (!res.ok) throw new Error("API error");

                const data = await res.json();

                if (!cancelled) {
                    if (Array.isArray(data?.profiles)) {

                        const filtered = data.profiles.filter(p => {

                            const k = cleanKeywordFn(p?.keyword || "");
                            const c = (p?.city || "").toLowerCase();

                            return (
                                (k.includes(keyword) || keyword.includes(k)) &&
                                c.includes(city)
                            );
                        });

                        setProfiles(filtered);

                    } else {
                        setProfiles([]);
                    }

                    setLoadingProfiles(false);
                }

            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    setError("Impossible de charger les professionnels");
                    setLoadingProfiles(false);
                }
            }
        };

        loadProfiles();

        return () => {
            cancelled = true;
        };

    }, [keyword, city, isInvalid]);

    /* ========================= */
    /* ❌ INVALID */
    /* ========================= */
    if (isInvalid) {
        return <div className="p-10 text-center">❌ Page invalide</div>;
    }

    /* ========================= */
    /* 🔥 SEO META */
    /* ========================= */
    const title = `${keywordLabel} à ${cityLabel} | Meilleurs services`;

    const description =
        seoPage?.content?.replace(/<[^>]+>/g, "").slice(0, 155) ||
        `Trouvez les meilleurs ${keyword} à ${cityLabel}`;

    return (
        <div className="max-w-4xl mx-auto p-10">

            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Helmet>

            {/* H1 */}
            <h1 className="text-3xl font-bold mb-4">
                🔍 {keywordLabel} à {cityLabel}
            </h1>

            {/* ========================= */}
            {/* 🔥 SEO CONTENT (BACKEND ONLY) */}
            {/* ========================= */}
            {loadingSeo ? (
                <p className="text-gray-500 mb-6">Chargement du contenu...</p>
            ) : seoPage?.content ? (
                <div
                    className="text-gray-700 mb-6 space-y-4"
                    dangerouslySetInnerHTML={{ __html: seoPage.content }}
                />
            ) : (
                <p className="text-red-500 mb-6">
                    Contenu SEO indisponible
                </p>
            )}

            {/* ========================= */}
            {/* 🔥 SEO DATA (SOURCE UNIQUE) */}
            {/* ========================= */}
            {seoPage && (
                <div className="bg-green-50 p-4 rounded-xl mb-6">
                    💰 Potentiel estimé :{" "}
                    <strong>{seoPage.revenue}€ / mois</strong>
                    <br />
                    ⚔️ Concurrence :{" "}
                    <strong>{seoPage.competition}</strong>
                </div>
            )}

            {/* ========================= */}
            {/* LISTING */}
            {/* ========================= */}
            {loadingProfiles && <p>Chargement...</p>}

            {error && <p className="text-red-500">{error}</p>}

            {!loadingProfiles && profiles.length === 0 && (
                <div className="bg-gray-100 p-4 rounded-xl mb-8 text-center">
                    Aucun professionnel trouvé pour {keywordLabel} à {cityLabel}
                </div>
            )}

            {profiles.length > 0 && (
                <div className="space-y-4 mb-10">

                    <h2 className="text-2xl font-bold">
                        🔝 Meilleurs professionnels à {cityLabel}
                    </h2>

                    {profiles.map((p, i) => (
                        <div key={p.id || i} className="bg-white p-4 rounded-xl shadow">

                            <h3 className="font-semibold text-lg">
                                {p.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                                📍 {p.city}
                            </p>

                            <p className="text-gray-700">
                                {p.description}
                            </p>

                        </div>
                    ))}

                </div>
            )}

            {/* ========================= */}
            {/* CTA */}
            {/* ========================= */}
            <div className="bg-indigo-50 p-6 rounded-xl mb-10">
                <p className="font-semibold mb-2">
                    🚀 Recevez des clients en SEO
                </p>

                <Link
                    to={`/${lang}/register`}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                    🚀 S’inscrire gratuitement
                </Link>
            </div>

        </div>
    );
}