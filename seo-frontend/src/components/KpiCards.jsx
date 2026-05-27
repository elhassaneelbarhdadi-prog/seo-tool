export default function KpiCards({ result }) {

    const cards = [

        {
            label: "💰 ROI mensuel",
            value: result.roiScore,
            color:
                result.roiScore > 0
                    ? "from-green-500 to-emerald-600"
                    : "from-red-500 to-pink-600"
        },

        {
            label: "🚀 Trafic potentiel",
            value: result.trafficPosition1,
            color: "from-blue-500 to-indigo-600"
        },

        {
            label: "💵 CPC",
            value: result.cpc,
            color: "from-yellow-500 to-orange-500"
        },

        {
            label: "⚔️ Difficulté",
            value: result.difficulty,
            color: "from-red-500 to-pink-600"
        }

    ];

    return (

        <div
            className="
                grid
                grid-cols-2
                xl:grid-cols-4
                gap-3
                w-full
            "
        >

            {cards.map((card, i) => (

                <div
                    key={i}
                    className={`
                        bg-gradient-to-r
                        ${card.color}
                        rounded-xl
                        p-3
                        lg:p-4
                        text-white
                        shadow-sm
                        overflow-hidden
                        min-w-0
                    `}
                >

                    {/* LABEL */}
                    <p
                        className="
                            text-[11px]
                            lg:text-xs
                            opacity-80
                            truncate
                        "
                    >
                        {card.label}
                    </p>

                    {/* VALUE */}
                    <p
                        className="
                            text-lg
                            sm:text-xl
                            lg:text-2xl
                            font-black
                            mt-2
                            break-words
                            leading-none
                        "
                    >
                        {card.value}
                    </p>

                </div>

            ))}

        </div>

    );

}