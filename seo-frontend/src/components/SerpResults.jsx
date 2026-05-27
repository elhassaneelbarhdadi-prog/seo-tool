import { formatNumber } from "../utils/format";

export default function SerpResults({ serp }) {

    if (!Array.isArray(serp) || serp.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">

            <h2 className="font-bold text-lg">
                🌍 Concurrence Google
            </h2>

            <div className="space-y-3">

                {serp.map((s, i) => {

                    const link = s?.link || "#";
                    const title = s?.title || "Résultat";
                    const snippet = s?.snippet || "";
                    const traffic = Number(s?.traffic) || null;

                    return (
                        <a
                            key={i}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block border p-4 rounded-xl hover:shadow-md hover:border-indigo-200 transition"
                        >

                            {/* TITLE */}
                            <p className="font-semibold text-gray-800 line-clamp-1">
                                {i + 1}. {title}
                            </p>

                            {/* LINK */}
                            <p className="text-xs text-gray-400 truncate mt-1">
                                {link}
                            </p>

                            {/* SNIPPET */}
                            {snippet && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {snippet}
                                </p>
                            )}

                            {/* FOOTER */}
                            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">

                                {/* POSITION */}
                                <span>
                                    Position #{i + 1}
                                </span>

                                {/* TRAFFIC (si dispo) */}
                                {traffic && (
                                    <span className="text-indigo-600 font-medium">
                                        {formatNumber(traffic)} visites
                                    </span>
                                )}

                            </div>

                        </a>
                    );
                })}

            </div>

        </div>
    );
}