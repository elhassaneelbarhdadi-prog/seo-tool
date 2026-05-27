import ScoreCircle from "./ScoreCircle";
import DifficultyCircle from "./DifficultyCircle";
import { useTranslation } from "react-i18next";
import { formatNumber } from "../utils/format";

export default function KeywordHistory({
    history = [],
    deleteKeyword,
    onSelect
}) {

    const { t } = useTranslation();

    const hasHistory =
        Array.isArray(history) &&
        history.length > 0;

    if (!hasHistory) {
        return null;
    }

    return (

        <div className="
            bg-white
            shadow
            rounded-xl
            p-6
            w-full
            overflow-hidden
        ">

            {/* HEADER */}

            <div className="mb-6">

                <h2 className="
                    text-2xl
                    font-bold
                    text-gray-900
                ">
                    📚 Historique des mots-clés
                </h2>

                <p className="
                    text-sm
                    text-gray-400
                    mt-1
                ">
                    Dernières analyses enregistrées
                </p>

            </div>

            {/* LIST */}

            <div className="space-y-4">

                {history.map((item) => {

                    const score =
                        Number(item?.score) || 0;

                    const difficulty =
                        Number(item?.difficulty) || 0;

                    const volume =
                        Number(item?.volume) || 0;

                    const cpcValue =
                        Number(item?.cpc);

                    const cpcDisplay =
                        isNaN(cpcValue)
                            ? "-"
                            : `${cpcValue.toFixed(2)} €`;

                    const potential =
                        score >= 70
                            ? {
                                label: t("high"),
                                color: "green",
                                icon: "🔥"
                            }
                            : score >= 40
                                ? {
                                    label: t("medium"),
                                    color: "yellow",
                                    icon: "⚡"
                                }
                                : {
                                    label: t("low"),
                                    color: "gray",
                                    icon: "❌"
                                };

                    return (

                        <div
                            key={item?.id}
                            className="
                                flex
                                flex-col
                                md:flex-row
                                md:items-center
                                justify-between
                                gap-4
                                p-4
                                border
                                rounded-xl
                                hover:shadow-md
                                transition
                                bg-white
                                w-full
                            "
                        >

                            {/* LEFT */}

                            <div className="
                                flex
                                flex-col
                                w-full
                                md:w-1/4
                                min-w-0
                            ">

                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelect?.(
                                            item.keyword
                                        )
                                    }
                                    className="
                                        text-indigo-600
                                        font-semibold
                                        hover:underline
                                        text-left
                                        break-words
                                    "
                                >
                                    {item?.keyword || "-"}
                                </button>

                                <p className="
                                    text-xs
                                    text-gray-400
                                    mt-1
                                ">
                                    {formatNumber(volume)} recherches
                                </p>

                            </div>

                            {/* CENTER */}

                            <div className="
                                flex
                                items-center
                                justify-between
                                md:justify-center
                                gap-6
                                w-full
                                md:w-2/4
                            ">

                                <div className="text-center">

                                    <DifficultyCircle
                                        difficulty={difficulty}
                                    />

                                    <p className="
                                        text-xs
                                        text-gray-400
                                        mt-1
                                    ">
                                        {t("difficulty")}
                                    </p>

                                </div>

                                <div className="
                                    text-center
                                    min-w-[70px]
                                ">

                                    <p className="
                                        font-semibold
                                        text-lg
                                    ">
                                        {cpcDisplay}
                                    </p>

                                    <p className="
                                        text-xs
                                        text-gray-400
                                    ">
                                        CPC
                                    </p>

                                </div>

                                <div className="text-center">

                                    <ScoreCircle
                                        score={score}
                                    />

                                    <p className="
                                        text-xs
                                        text-gray-400
                                        mt-1
                                    ">
                                        {t("score")}
                                    </p>

                                </div>

                            </div>

                            {/* RIGHT */}

                            <div className="
                                flex
                                items-center
                                justify-between
                                md:justify-end
                                gap-3
                                w-full
                                md:w-1/4
                            ">

                                <span
                                    className={`
                                        text-sm
                                        font-medium
                                        px-3
                                        py-1
                                        rounded-full
                                        whitespace-nowrap

                                        ${potential.color === "green"
                                            ? "bg-green-100 text-green-600"
                                            : ""}

                                        ${potential.color === "yellow"
                                            ? "bg-yellow-100 text-yellow-600"
                                            : ""}

                                        ${potential.color === "gray"
                                            ? "bg-gray-100 text-gray-500"
                                            : ""}
                                    `}
                                >
                                    {potential.icon} {potential.label}
                                </span>

                                <button
                                    type="button"
                                    onClick={async () => {

                                        if (!deleteKeyword) {
                                            return;
                                        }

                                        const confirmDelete =
                                            window.confirm(
                                                t("confirmDelete")
                                            );

                                        if (!confirmDelete) {
                                            return;
                                        }

                                        try {

                                            await deleteKeyword(
                                                item.id
                                            );

                                        } catch (err) {

                                            console.error(
                                                "DELETE UI ERROR:",
                                                err
                                            );

                                        }

                                    }}
                                    className="
                                        text-red-500
                                        text-sm
                                        hover:underline
                                    "
                                >
                                    {t("delete")}
                                </button>

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}