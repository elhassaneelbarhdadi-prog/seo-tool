import ScoreCircle from "./ScoreCircle";
import DifficultyCircle from "./DifficultyCircle";
import { useTranslation } from "react-i18next";

export default function KeywordHistory({ history, deleteKeyword, onSelect }) {

    const { t } = useTranslation();

    if (!Array.isArray(history) || history.length === 0) {
        return (
            <div className="bg-white shadow rounded-xl p-6 mt-6">
                <h2 className="font-bold text-lg mb-4">
                    {t("history")}
                </h2>
                <p className="text-gray-400">
                    {t("noData")}
                </p>
            </div>
        );
    }

    return (

        <div className="bg-white shadow rounded-xl p-6 mt-6">

            <h2 className="font-bold text-lg mb-6">
                {t("history")}
            </h2>

            <div className="overflow-x-auto">

                <table className="w-full text-sm">

                    {/* HEADER */}
                    <thead>
                        <tr className="text-gray-400 text-xs uppercase border-b">
                            <th className="py-3 text-left">{t("keyword")}</th>
                            <th className="py-3 text-left">{t("volume")}</th>
                            <th className="py-3 text-center">{t("difficulty")}</th>
                            <th className="py-3 text-left">CPC</th>
                            <th className="py-3 text-center">{t("score")}</th>
                            <th className="py-3 text-left">{t("potential")}</th>
                            <th className="py-3 text-center">{t("action")}</th>
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y">

                        {history.map((item) => {

                            const score = Number(item?.score) || 0;
                            const difficulty = Number(item?.difficulty) || 0;
                            const volume = Number(item?.volume) || 0;
                            const cpc = Number(item?.cpc) || 0;

                            return (

                                <tr key={item?.id} className="hover:bg-gray-50 transition">

                                    {/* KEYWORD (CLICABLE 🔥) */}
                                    <td
                                        className="py-4 font-semibold text-blue-600 cursor-pointer hover:underline"
                                        onClick={() => onSelect && onSelect(item.keyword)}
                                    >
                                        {item?.keyword || "-"}
                                    </td>

                                    {/* VOLUME */}
                                    <td className="py-4">
                                        {volume.toLocaleString()}
                                    </td>

                                    {/* DIFFICULTY */}
                                    <td className="py-4 text-center">
                                        <div className="flex justify-center">
                                            <DifficultyCircle difficulty={difficulty} />
                                        </div>
                                    </td>

                                    {/* CPC */}
                                    <td className="py-4">
                                        <span className="whitespace-nowrap">
                                            {cpc > 0 ? `${cpc.toFixed(2)} €` : "-"}
                                        </span>
                                    </td>

                                    {/* SCORE */}
                                    <td className="py-4 text-center">
                                        <div className="flex justify-center">
                                            <ScoreCircle score={score} />
                                        </div>
                                    </td>

                                    {/* POTENTIAL */}
                                    <td className="py-4">
                                        {score >= 70 ? (
                                            <span className="text-green-600 font-semibold">
                                                🔥 {t("high")}
                                            </span>
                                        ) : score >= 40 ? (
                                            <span className="text-yellow-600 font-semibold">
                                                ⚡ {t("medium")}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">
                                                {t("low")}
                                            </span>
                                        )}
                                    </td>

                                    {/* DELETE */}
                                    <td className="py-4 text-center">
                                        <button
                                            onClick={() => deleteKeyword(item.id)}
                                            className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-sm transition"
                                        >
                                            {t("delete")}
                                        </button>
                                    </td>

                                </tr>

                            );
                        })}

                    </tbody>

                </table>

            </div>

        </div>

    );
}