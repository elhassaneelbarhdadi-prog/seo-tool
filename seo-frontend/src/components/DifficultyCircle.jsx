import { useTranslation } from "react-i18next";

const SIZE = 70;
const STROKE = 6;

const EASY = 30;
const MEDIUM = 70;

export default function DifficultyCircle({

    difficulty = 0

}) {

    const { t } =
        useTranslation();

    /* ========================= */
    /* SAFE VALUE */
    /* ========================= */

    const value =
        Math.min(
            Math.max(
                Number(difficulty) || 0,
                0
            ),
            100
        );

    /* ========================= */
    /* SVG */
    /* ========================= */

    const radius =
        (SIZE / 2) - STROKE;

    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        ((value / 100)
            * circumference);

    /* ========================= */
    /* COLOR */
    /* ========================= */

    let color =
        "#ef4444";

    if (value <= EASY) {
        color = "#22c55e";
    }

    else if (
        value <= MEDIUM
    ) {

        color =
            "#f59e0b";

    }

    /* ========================= */
    /* LABEL */
    /* ========================= */

    let label =
        t("hard");

    if (value <= EASY) {
        label =
            t("easy");
    }

    else if (
        value <= MEDIUM
    ) {

        label =
            t("medium");

    }

    const ariaText =

        `${t("difficulty")} ${value}/100 - ${label}`;

    return (

        <div
            className="
            flex
            flex-col
            items-center
            justify-center
            "
        >

            <svg

                width={SIZE}

                height={SIZE}

                role="img"

                aria-label={
                    ariaText
                }

                className="
                -rotate-90
                "

            >

                <title>
                    {ariaText}
                </title>

                {/* background */}

                <circle

                    stroke="#e5e7eb"

                    fill="transparent"

                    strokeWidth={STROKE}

                    r={radius}

                    cx={SIZE / 2}

                    cy={SIZE / 2}

                />

                {/* progress */}

                <circle

                    stroke={color}

                    fill="transparent"

                    strokeWidth={STROKE}

                    strokeLinecap="round"

                    strokeDasharray={
                        circumference
                    }

                    strokeDashoffset={
                        offset
                    }

                    r={radius}

                    cx={SIZE / 2}

                    cy={SIZE / 2}

                    style={{

                        transition:
                            "stroke-dashoffset .6s ease, stroke .3s ease"

                    }}

                />

                {/* center text */}

                <text

                    x="50%"

                    y="50%"

                    textAnchor="middle"

                    dominantBaseline="middle"

                    transform={`rotate(90 ${SIZE / 2} ${SIZE / 2})`}

                    className="
                    text-sm
                    font-bold
                    fill-gray-700
                    "

                >

                    {value}

                </text>

            </svg>

            <span
                className="
                text-xs
                mt-1
                text-gray-500
                "
            >

                {label}

            </span>

        </div>

    );

}