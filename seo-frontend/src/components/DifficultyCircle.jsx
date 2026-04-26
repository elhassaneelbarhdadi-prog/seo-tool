import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export default function DifficultyCircle({ difficulty }) {

    const { t } = useTranslation();

    const value = useMemo(() => {
        return Math.min(Math.max(Number(difficulty) || 0, 0), 100);
    }, [difficulty]);

    const radius = 28;
    const stroke = 6;
    const normalizedRadius = radius;
    const circumference = 2 * Math.PI * normalizedRadius;
    const offset = circumference - (value / 100) * circumference;

    const color = useMemo(() => {
        if (value <= 30) return "#22c55e";
        if (value <= 70) return "#f59e0b";
        return "#ef4444";
    }, [value]);

    const label = useMemo(() => {
        if (value <= 30) return t("easy") || "Facile";
        if (value <= 70) return t("medium") || "Moyen";
        return t("hard") || "Difficile";
    }, [value, t]);

    return (
        <div className="flex flex-col items-center justify-center">

            <svg width="70" height="70" className="transform -rotate-90">

                {/* fond */}
                <circle
                    stroke="#e5e7eb"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx="35"
                    cy="35"
                />

                {/* progression */}
                <circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    r={normalizedRadius}
                    cx="35"
                    cy="35"
                    style={{
                        transition: "stroke-dashoffset 0.6s ease"
                    }}
                />

                {/* TEXTE */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-sm font-bold fill-gray-700 rotate-90 origin-center"
                >
                    {value}
                </text>

            </svg>

            {/* LABEL */}
            <span className="text-xs mt-1 text-gray-500">
                {label}
            </span>

        </div>
    );
}