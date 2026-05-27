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

    /* ========================= */
    /* ✅ SAFE HISTORY */
    /* ========================= */

    const safeHistory =
        Array.isArray(history)
            ? history
            : [];

    /* ========================= */
    /* 🚫 EMPTY */
    /* ========================= */

    if (safeHistory.length === 0) {

        return null;

    }

    return (

        <div className="
            bg-white
            shadow
            rounded-xl
            p-6
            mt-6
        ">

            {/* HEADER */}

            <div className="mb-6">

                <h2 className="
                    font-bold
                    text-2xl
                    flex
                    items-center
                    gap-2
                ">
                    📚 {t("history")}
                </h2>

                <p className="
                    text-gray-400
                    mt-1
                ">
                    Dernières analyses enregistrées
                </p>

            </div>

            {/* LIST */}

            <div className="space-y-4">

                {safeHistory.map((item, index) => {

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
                            key={
                                item?.id ||
                                `${item?.keyword}-${index}`
                            }
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
                                bg-white
                                hover:shadow-md
                                hover:border-indigo-200
                                transition
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
                                        truncate
                                        cursor-pointer
                                    "
                                    title={item?.keyword}
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
                                gap-8
                                w-full
                                md:w-2/4
                            ">

                                {/* DIFFICULTY */}

                                <div className="
                                    text-center
                                    min-w-[70px]
                                ">

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

                                {/* CPC */}

                                <div className="
                                    text-center
                                    min-w-[80px]
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

                                {/* SCORE */}

                                <div className="
                                    text-center
                                    min-w-[70px]
                                ">

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

                                {/* POTENTIAL */}

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

                                {/* DELETE */}

                                <button
                                    type="button"
                                    onClick={() => {

                                        if (!deleteKeyword) {
                                            return;
                                        }

                                        if (
                                            window.confirm(
                                                t("confirmDelete")
                                            )
                                        ) {

                                            deleteKeyword(
                                                item?.id
                                            );

                                        }

                                    }}
                                    className="
                                        text-red-500
                                        text-sm
                                        hover:text-red-700
                                        hover:underline
                                        transition
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