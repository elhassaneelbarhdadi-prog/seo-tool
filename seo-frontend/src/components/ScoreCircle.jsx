export default function ScoreCircle({ score = 0 }) {

    const normalized = Math.min(score, 100)

    const radius = 18
    const stroke = 5
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (normalized / 100) * circumference

    const color =
        normalized >= 70
            ? "#22c55e"
            : normalized >= 40
                ? "#f59e0b"
                : "#ef4444"

    return (

        <svg width="45" height="45">

            {/* fond */}

            <circle
                cx="22"
                cy="22"
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={stroke}
                fill="none"
            />

            {/* progression */}

            <circle
                cx="22"
                cy="22"
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 22 22)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />

            {/* texte */}

            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    fill: "#374151"
                }}
            >
                {normalized}
            </text>

        </svg>

    )
}