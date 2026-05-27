import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

import { formatNumber } from "../utils/format";
import { request } from "../services/api";
import UsageBar from "../components/UsageBar";

export default function Dashboard() {

    console.log("🔥 DASHBOARD LOADED");

    const { lang } = useParams();

    const { t, i18n } = useTranslation();



    const [usage, setUsage] = useState(null);

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);

    /* ========================= */
    /* 🌍 SYNC LANG */
    /* ========================= */

    useEffect(() => {

        if (
            lang &&
            !i18n.language.startsWith(lang)
        ) {

            i18n.changeLanguage(lang);

            localStorage.setItem(
                "lang",
                lang
            );

        }

    }, [lang, i18n]);

    /* ========================= */
    /* 📡 LOAD USAGE */
    /* ========================= */

    const loadUsage = useCallback(async () => {

        try {

            const data =
                await request(
                    "/keyword/usage"
                );

            console.log(
                "🔥 RESPONSE COMPLETE:",
                data
            );

            const formatted = {

                used:
                    Number(
                        data?.used ?? 0
                    ),

                limit:
                    data?.limit === null
                        ? null
                        : Number(
                            data?.limit ?? 5
                        ),

                plan:
                    String(
                        data?.plan ||
                        "FREE"
                    )

            };

            console.log(
                "🔥 USAGE:",
                formatted
            );

            setUsage(
                formatted
            );

            return formatted;

        }

        catch (error) {

            console.error(
                "USAGE ERROR:",
                error
            );

            const fallback = {

                used: 0,

                limit: 5,

                plan: "FREE"

            };

            setUsage(
                fallback
            );

            return fallback;

        }

    }, []);

    /* ========================= */
    /* 🔥 RESET DEV */
    /* ========================= */







    /* ========================= */
    /* 📡 LOAD DATA */
    /* ========================= */

    useEffect(() => {

        let mounted = true;

        const loadData = async () => {

            try {

                setLoading(true);

                await loadUsage();

                const historyData =
                    await request(
                        "/keyword/history"
                    );

                if (!mounted) {
                    return;
                }

                setHistory(

                    Array.isArray(historyData)

                        ? historyData

                        : historyData?.data || []

                );

            }

            catch (err) {

                console.error(
                    "DASHBOARD:",
                    err
                );

            }

            finally {

                if (mounted) {

                    setLoading(false);

                }

            }

        };

        loadData();

        return () => {

            mounted = false;

        };

    }, [loadUsage]);

    /* ========================= */
    /* ⏳ LOADING */
    /* ========================= */

    if (loading) {

        return (
            <div className="p-10 text-center text-gray-500">
                {t("loading")}
            </div>
        );

    }

    /* ========================= */
    /* 📊 DATA */
    /* ========================= */

    const currentPlan =
        (usage?.plan || "FREE")
            .toUpperCase();

    const used =
        Number(
            usage?.used ?? 0
        );

    const limit =
        usage?.limit === null
            ? Infinity
            : Number(
                usage?.limit ?? 5
            );

    const isUnlimited =
        !Number.isFinite(limit);

    console.log(
        "🔥 FINAL USAGE:",
        {
            used,
            limit
        }
    );

    const latest =
        history[0] || {};

    const score =
        Number(latest?.score || 0);

    const volume =
        Number(latest?.volume || 0);

    const cpc =
        Number(latest?.cpc || 0);

    /* ========================= */
    /* 📈 TREND DATA */
    /* ========================= */

    /* ========================= */
    /* 📈 TREND DATA */
    /* ========================= */

    let parsedTrend = [];

    try {

        if (latest?.trend) {

            parsedTrend =
                typeof latest.trend === "string"
                    ? JSON.parse(latest.trend)
                    : latest.trend;

        }

    } catch {

        parsedTrend = [];

    }

    /* 🔥 sécurisation */
    parsedTrend = Array.isArray(parsedTrend)
        ? parsedTrend
            .map(v => Number(v || 0))
            .filter(v => v > 0)
        : [];

    /* 🔥 fallback intelligent */
    if (parsedTrend.length === 0 && volume > 0) {

        parsedTrend = Array.from(
            { length: 6 },
            (_, i) => {

                const variation =
                    Math.sin(i / 1.5) * 180;

                return Math.round(
                    volume + variation
                );

            }
        );

    }

    /* 🔥 génération vrais mois */
    const trendData = parsedTrend.map(
        (value, index) => {

            const date = new Date();

            date.setMonth(
                date.getMonth() -
                (parsedTrend.length - 1 - index)
            );

            return {

                month: date.toLocaleString(
                    "fr-FR",
                    {
                        month: "short"
                    }
                ),

                value: Number(value || 0)

            };

        }
    );




    /* ========================= */
    /* 📏 Y AXIS */
    /* ========================= */

    const values =
        trendData.map(
            i => i.value
        );

    const minValue =
        values.length
            ? Math.min(...values)
            : 0;

    const maxValue =
        values.length
            ? Math.max(...values)
            : 100;

    const padding =
        Math.max(
            (maxValue - minValue) * 0.15,
            50
        );

    const yMin =
        Math.max(
            0,
            minValue - padding
        );

    const yMax =
        maxValue + padding;

    return (

        <div className="
            p-4
            lg:p-6
            space-y-5
            overflow-x-hidden
            w-full
        ">

            {/* HERO */}

            <div className="
                relative
                overflow-hidden
                bg-gradient-to-r
                from-indigo-600
                via-purple-600
                to-fuchsia-600
                rounded-2xl
                px-4
                py-5
                lg:px-6
                lg:py-6
                text-white
                shadow-lg
            ">

                <div className="
                    absolute
                    top-0
                    right-0
                    w-52
                    h-52
                    bg-white/10
                    rounded-full
                    blur-3xl
                " />

                <div className="
                    relative
                    z-10
                    flex
                    flex-col
                    gap-6
                ">

                    <div className="max-w-2xl">

                        <div className="
                            inline-flex
                            items-center
                            gap-2
                            px-3
                            py-1.5
                            rounded-full
                            bg-white/10
                            border
                            border-white/20
                            text-xs
                            mb-4
                        ">
                            🚀 Dashboard SEO intelligent
                        </div>

                        <h1 className="
                            text-3xl
                            sm:text-4xl
                            lg:text-5xl
                            font-black
                            leading-tight
                            tracking-tight
                            max-w-[620px]
                        ">
                            Analysez vos mots-clés
                            et trouvez des niches
                            rentables
                        </h1>

                    </div>

                </div>

            </div>

            {/* KPI */}

            <div className="
                grid
                grid-cols-2
                xl:grid-cols-4
                gap-4
            ">

                {[
                    {
                        title: "Score SEO",
                        value: score,
                        color: "text-orange-500",
                        bg: "bg-orange-100",
                        icon: "🚀"
                    },
                    {
                        title: "Volume SEO",
                        value: formatNumber(volume),
                        color: "",
                        bg: "bg-indigo-100",
                        icon: "📈"
                    },
                    {
                        title: "CPC moyen",
                        value: `${cpc.toFixed(2)}€`,
                        color: "",
                        bg: "bg-green-100",
                        icon: "💸"
                    },
                    {
                        title: "Utilisation",
                        value: `${used}/${isUnlimited ? "∞" : limit}`,
                        subtitle: "recherches",
                        color: "",
                        bg: "bg-purple-100",
                        icon: "👑"
                    }
                ].map((card, index) => (

                    <div
                        key={index}
                        className="
                            bg-white
                            rounded-2xl
                            p-4
                            shadow-sm
                            overflow-hidden
                        "
                    >

                        <p className="
                            text-gray-400
                            text-xs
                            mb-3
                        ">
                            {card.title}
                        </p>

                        <div className="
                            flex
                            items-center
                            justify-between
                            gap-3
                        ">

                            <div>

                                <h2 className={`
                                    text-2xl
                                    lg:text-4xl
                                    font-black
                                    truncate
                                    ${card.color}
                                `}>
                                    {card.value}
                                </h2>

                                {card.subtitle && (
                                    <p className="
                                        text-xs
                                        text-gray-400
                                        mt-1
                                    ">
                                        {card.subtitle}
                                    </p>
                                )}

                            </div>

                            <div className={`
                                w-12
                                h-12
                                rounded-xl
                                flex
                                items-center
                                justify-center
                                text-xl
                                shrink-0
                                ${card.bg}
                            `}>
                                {card.icon}
                            </div>

                        </div>

                    </div>

                ))}

            </div>

            {/* CHART */}

            <div className="w-full">

                <div className="
                    bg-white
                    rounded-2xl
                    p-4
                    lg:p-5
                    shadow-sm
                    overflow-hidden
                    min-w-0
                ">

                    <h2 className="
                        text-2xl
                        lg:text-3xl
                        font-black
                        mb-1
                    ">
                        📈 Potentiel SEO
                    </h2>

                    <p className="
                        text-gray-400
                        text-sm
                        lg:text-base
                        mb-4
                    ">
                        Historique SEO sur 12 mois
                    </p>

                    {trendData.length > 0 ? (

                        <div className="
                            h-[320px]
                            min-w-0
                            w-full
                        ">

                            <ResponsiveContainer
                                width="100%"
                                height={300}
                                minWidth={0}
                            >

                                <AreaChart data={trendData}>

                                    <defs>

                                        <linearGradient
                                            id="colorSeo"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >

                                            <stop
                                                offset="0%"
                                                stopColor="#22c55e"
                                                stopOpacity={0.25}
                                            />

                                            <stop
                                                offset="100%"
                                                stopColor="#22c55e"
                                                stopOpacity={0}
                                            />

                                        </linearGradient>

                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f1f5f9"
                                    />

                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />

                                    <YAxis
                                        domain={[yMin, yMax]}
                                        tick={{ fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) =>
                                            formatNumber(v)
                                        }
                                    />

                                    <Tooltip
                                        formatter={(v) =>
                                            `${formatNumber(v)} recherches`
                                        }
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        fill="url(#colorSeo)"
                                    />

                                </AreaChart>

                            </ResponsiveContainer>

                        </div>

                    ) : (

                        <div className="
                            h-[260px]
                            lg:h-[320px]
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
                            Aucune donnée SEO disponible
                        </div>

                    )}

                </div>

            </div>

            {/* USAGE */}

            <div className="
                bg-white
                rounded-2xl
                shadow-sm
                p-5
            ">

                <div className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    justify-between
                    gap-4
                    mb-5
                ">

                    <div>

                        <h2 className="
                            text-xl
                            font-bold
                        ">
                            {t("currentPlan")} :
                            {" "}
                            {t(`plan_${currentPlan}`)}
                        </h2>

                        <p className="
                            text-gray-500
                            mt-1
                            text-sm
                        ">
                            {used}
                            {" / "}
                            {isUnlimited ? "∞" : limit}
                            {" recherches utilisées"}
                        </p>

                    </div>

                </div>

                <UsageBar
                    used={Number(used)}
                    limit={
                        isUnlimited
                            ? Infinity
                            : Number(limit)
                    }
                />

            </div>

            {/* DEV */}



        </div>

    );

}