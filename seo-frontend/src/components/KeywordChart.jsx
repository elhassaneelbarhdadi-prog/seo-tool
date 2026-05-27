
import { useMemo } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer
} from "recharts";

import { formatNumber } from "../utils/format";

export default function KeywordChart({ result }) {

    /* ========================= */
    /* 📅 MONTHS */
    /* ========================= */

    const months = useMemo(() => {

        const totalMonths =
            result?.trend?.length || 12;

        const now = new Date();

        return Array.from(
            { length: totalMonths },
            (_, index) => {

                const d = new Date();

                d.setMonth(
                    now.getMonth() - (totalMonths - 1 - index)
                );

                return d.toLocaleString(
                    "fr-FR",
                    {
                        month: "short"
                    }
                );

            }
        );

    }, [result]);
    /* ========================= */
    /* 📈 TREND DATA */
    /* ========================= */

    const trendData = useMemo(() => {

        if (
            !Array.isArray(result?.trend)
        ) {
            return [];
        }

        return result.trend.map(
            (value, index) => ({

                month:
                    months[index]
                    || `M${index + 1}`,

                volume:
                    Number(value || 0)

            })
        );

    }, [result, months]);

    /* ========================= */
    /* 📊 AVERAGE */
    /* ========================= */

    const averageVolume = useMemo(() => {

        if (!trendData.length) {
            return 0;
        }

        const total = trendData.reduce(
            (sum, item) =>
                sum + item.volume,
            0
        );

        return Math.round(
            total / trendData.length
        );

    }, [trendData]);

    /* ========================= */
    /* 📈 TREND STATUS */
    /* ========================= */

    const trendMeta = useMemo(() => {

        if (trendData.length < 6) {

            return {
                label: "Données limitées",
                color: "text-gray-400"
            };

        }

        const recent =
            trendData.slice(-3);

        const previous =
            trendData.slice(-6, -3);

        const recentAvg =
            recent.reduce(
                (sum, item) =>
                    sum + item.volume,
                0
            ) / recent.length;

        const previousAvg =
            previous.reduce(
                (sum, item) =>
                    sum + item.volume,
                0
            ) / previous.length;

        if (previousAvg <= 0) {

            return {
                label: "➡️ Stable",
                color: "text-gray-500"
            };

        }

        const diff =
            (recentAvg - previousAvg)
            / previousAvg;

        if (diff > 0.15) {

            return {
                label: "📈 Forte croissance",
                color: "text-green-600"
            };

        }

        if (diff > 0.05) {

            return {
                label: "📈 Croissance",
                color: "text-green-500"
            };

        }

        if (diff < -0.15) {

            return {
                label: "📉 Forte baisse",
                color: "text-red-600"
            };

        }

        if (diff < -0.05) {

            return {
                label: "📉 Baisse",
                color: "text-red-500"
            };

        }

        return {
            label: "➡️ Stable",
            color: "text-gray-500"
        };

    }, [trendData]);

    /* ========================= */
    /* EMPTY STATE */
    /* ========================= */

    if (!trendData.length) {

        return (

            <div className="
                bg-white
                p-4
                rounded-xl
                shadow-sm
                border
                border-gray-100
            ">

                <h2 className="
                    text-sm
                    font-semibold
                    mb-4
                ">
                    📈 Tendance SEO
                </h2>

                <div className="
                    h-[170px]
                    flex
                    items-center
                    justify-center
                    text-gray-400
                    text-sm
                    border
                    border-dashed
                    border-gray-200
                    rounded-xl
                ">
                    Aucune donnée disponible
                </div>

            </div>

        );

    }

    return (

        <div className="
            bg-white
            p-4
            rounded-2xl
            shadow-sm
            border
            border-gray-100
        ">

            {/* HEADER */}

            <div className="
                flex
                justify-between
                items-center
                mb-4
            ">

                <h2 className="
                    text-lg
                    font-bold
                    text-gray-800
                ">
                    📈 Tendance SEO
                </h2>

                <span className={`
                    text-xs
                    font-semibold
                    ${trendMeta.color}
                `}>
                    {trendMeta.label}
                </span>

            </div>

            {/* CHART */}

            <div className="h-[240px]">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <LineChart data={trendData}>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                        />

                        <XAxis
                            dataKey="month"
                            tick={{
                                fontSize: 11
                            }}
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            width={60}
                            tick={{
                                fontSize: 11
                            }}
                            tickFormatter={
                                formatNumber
                            }
                            tickLine={false}
                            axisLine={false}
                        />

                        <Tooltip
                            formatter={(value) => [

                                `${formatNumber(value)} recherches`,

                                "Volume"

                            ]}
                        />

                        {averageVolume > 0 && (

                            <ReferenceLine
                                y={averageVolume}
                                stroke="#22c55e"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                label={{
                                    value: "Moyenne",
                                    position: "right",
                                    fill: "#16a34a",
                                    fontSize: 11
                                }}
                            />

                        )}

                        <Line
                            type="monotone"
                            dataKey="volume"
                            stroke="#6366f1"
                            strokeWidth={4}
                            dot={false}
                            activeDot={{
                                r: 7
                            }}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

            <p className="
                text-xs
                text-gray-400
                mt-3
            ">
                📊 Historique SEO réel sur les 6 derniers mois
            </p>

        </div>

    );

}