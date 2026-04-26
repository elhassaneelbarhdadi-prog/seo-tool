import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNichesAI } from "../services/api";

export default function EasyNiches({ result, onSelect }) {

    const navigate = useNavigate();
    const { lang } = useParams();
    const currentLang = lang || "fr";

    const [loadingKeyword, setLoadingKeyword] = useState(null);
    const [niches, setNiches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [limited, setLimited] = useState(false);

    /* ========================= */
    /* 📡 LOAD NICHES */
    /* ========================= */
    useEffect(() => {

        if (!result?.keyword) {
            setNiches([]);
            return;
        }

        let isMounted = true;

        const load = async () => {

            setLoading(true);
            setLimited(false);

            try {
                const data = await getNichesAI(result.keyword);

                console.log("NICHES API 👉", data);

                let list = [];

                if (Array.isArray(data)) {
                    list = data;
                } else if (Array.isArray(data?.niches)) {
                    list = data.niches;
                }

                const unique = list.filter(
                    (item, index, self) =>
                        item?.keyword &&
                        index === self.findIndex(i => i.keyword === item.keyword)
                );

                if (isMounted) {
                    setNiches(unique);
                    setLimited(data?.limited || false);
                }

            } catch (err) {

                console.error("❌ NICHES ERROR:", err);

                if (err.code === "UPGRADE_REQUIRED") {
                    navigate(`/${currentLang}/dashboard/pricing`);
                    return;
                }

                if (isMounted) setNiches([]);

            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();

        return () => { isMounted = false; };

    }, [result?.keyword, navigate, currentLang]);

    const goToNichesPage = () => {
        navigate(`/${currentLang}/dashboard/niches`);
    };

    return (
        <div className="bg-white shadow rounded-xl p-6 mt-6">

            {/* CTA */}
            <div
                onClick={goToNichesPage}
                className="group mb-4 p-5 rounded-xl cursor-pointer
                bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                hover:scale-105 transition"
            >
                <p className="font-bold text-lg">
                    🤖 Générateur de niches SEO
                </p>
                <p className="text-sm text-purple-100">
                    Trouvez des idées business rentables
                </p>
            </div>

            {/* LOADING */}
            {loading && (
                <p className="text-sm text-gray-500 mb-3">
                    ⏳ Génération...
                </p>
            )}

            {/* EMPTY */}
            {!loading && niches.length === 0 && (
                <p className="text-sm text-gray-400">
                    Aucune suggestion
                </p>
            )}

            {/* LIST */}
            <div className="flex flex-wrap gap-2">
                {niches.map((n, i) => {

                    const k = n.keyword;

                    return (
                        <button
                            key={i}
                            disabled={loadingKeyword === k}
                            onClick={async () => {

                                if (loadingKeyword) return;

                                setLoadingKeyword(k);

                                try {
                                    await onSelect(k);
                                } catch (err) {
                                    console.error("SELECT ERROR:", err);
                                }

                                setLoadingKeyword(null);
                            }}
                            className={`px-4 py-2 rounded
                            ${loadingKeyword === k
                                    ? "bg-gray-400"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                }`}
                        >
                            {loadingKeyword === k ? "⏳" : k}
                        </button>
                    );
                })}
            </div>

            {/* 🔥 LIMIT MESSAGE */}
            {limited && (
                <div className="mt-4 text-sm text-orange-500">
                    🔒 3 niches affichées — passe au plan PRO pour débloquer tout
                </div>
            )}

        </div>
    );
}