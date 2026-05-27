import { formatNumber } from "../utils/format";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer
} from "recharts";

const COLORS = {
    commercial: "#6366f1",
    informational: "#22c55e",
    transactional: "#f59e0b",
    navigational: "#3b82f6"
};

export default function IntentChart({ intents = {} }) {

    const data = [

        {
            name: "Commerciale",
            value: intents.commercial || 0,
            key: "commercial",
            description: "Compare des offres"
        },

        {
            name: "Informationnelle",
            value: intents.informational || 0,
            key: "informational",
            description: "Recherche des informations"
        },

        {
            name: "Transactionnelle",
            value: intents.transactional || 0,
            key: "transactional",
            description: "Prêt à acheter"
        },

        {
            name: "Navigationnelle",
            value: intents.navigational || 0,
            key: "navigational",
            description: "Recherche une marque"
        }

    ].filter((item) => item.value > 0);

    /* ========================= */
    /* EMPTY */
    /* ========================= */

    if (!data.length) {

        return (

            <div
                className="
                    bg-white
                    p-6
                    rounded-2xl
                    shadow-sm
                    border
                    border-gray-100
                    text-center
                    text-gray-400
                    text-sm
                    min-h-[420px]
                    flex
                    items-center
                    justify-center
                "
            >
                Aucune donnée d’intention disponible
            </div>

        );

    }

    /* ========================= */
    /* UI */
    /* ========================= */

    return (

        <div
            className="
                bg-white
                rounded-2xl
                shadow-sm
                border
                border-gray-100
                overflow-hidden
                w-full
                p-6
                h-full
                flex
                flex-col
            "
        >

            {/* HEADER */}

            <div className="mb-6">

                <h2
                    className="
                        text-xl
                        lg:text-2xl
                        font-bold
                        flex
                        items-center
                        gap-2
                    "
                >
                    🎯 Intentions SEO
                </h2>

                <p
                    className="
                        text-sm
                        text-gray-400
                        mt-1
                    "
                >
                    comportement utilisateur
                </p>

            </div>


            {/* CONTENT */}

            <div
                className="
                    grid
                    grid-cols-1
                    xl:grid-cols-[0.9fr_1.1fr]
                    gap-6
                    items-center
                    flex-1
                "
            >

                {/* CHART */}

                <div
                    className="
                        flex
                        items-center
                        justify-center
                    "
                >

                    <div
                        className="
                            w-[210px]
                            h-[210px]
                            shrink-0
                        "
                    >

                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >

                            <PieChart>

                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={45}
                                    outerRadius={78}
                                    paddingAngle={2}
                                    stroke="none"
                                >

                                    {data.map((entry, index) => (

                                        <Cell
                                            key={index}
                                            fill={COLORS[entry.key]}
                                        />

                                    ))}

                                </Pie>

                                <Tooltip
                                    formatter={(value) =>
                                        `${formatNumber(value)}%`
                                    }
                                    contentStyle={{
                                        borderRadius: "14px",
                                        border: "1px solid #e5e7eb",
                                        boxShadow:
                                            "0 8px 30px rgba(0,0,0,0.08)",
                                        fontSize: "12px"
                                    }}
                                />

                            </PieChart>

                        </ResponsiveContainer>

                    </div>

                </div>


                {/* LEGEND */}

                <div
                    className="
                        flex
                        flex-col
                        gap-4
                    "
                >

                    {data.map((item, index) => (

                        <div
                            key={index}
                            className="
                                bg-gray-50
                                border
                                border-gray-100
                                rounded-2xl
                                p-4
                                hover:shadow-sm
                                transition
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-3
                                "
                            >

                                <div
                                    className="
                                        w-4
                                        h-4
                                        rounded-full
                                        shrink-0
                                    "
                                    style={{
                                        backgroundColor:
                                            COLORS[item.key]
                                    }}
                                />

                                <span
                                    className="
                                        text-sm
                                        lg:text-base
                                        font-semibold
                                    "
                                >
                                    {item.name}
                                </span>

                                <span
                                    className="
                                        ml-auto
                                        text-base
                                        font-black
                                    "
                                >
                                    {item.value}%
                                </span>

                            </div>

                            <p
                                className="
                                    text-xs
                                    lg:text-sm
                                    text-gray-400
                                    mt-2
                                    pl-7
                                    leading-relaxed
                                "
                            >
                                {item.description}
                            </p>

                        </div>

                    ))}

                </div>

            </div>


            {/* INFO */}

            <div
                className="
                    mt-6
                    bg-blue-50
                    border
                    border-blue-100
                    rounded-xl
                    p-4
                    flex
                    gap-3
                    items-start
                "
            >

                <div className="text-lg shrink-0">
                    ℹ️
                </div>

                <p
                    className="
                        text-xs
                        text-gray-600
                        leading-relaxed
                    "
                >
                    Les intentions SEO représentent l’objectif réel
                    des internautes : s’informer, comparer,
                    acheter ou rechercher une marque précise.
                </p>

            </div>

        </div>

    );

}