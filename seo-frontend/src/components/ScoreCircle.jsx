export default function ScoreCircle({
    score = 0,
    size = 45
}) {

    /* ========================= */
    /* 🧠 NORMALIZE */
    /* ========================= */
    const value = Math.max(0, Math.min(Number(score) || 0, 100));

    /* ========================= */
    /* 📐 DIMENSIONS */
    /* ========================= */
    const radius = size / 2 - 6;
    const stroke = 5;
    const center = size / 2;

    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    /* ========================= */
    /* 🎨 COLOR */
    /* ========================= */
    const color =
        value >= 70
            ? "#22c55e"
            : value >= 40
                ? "#f59e0b"
                : "#ef4444";

    return (

        <svg
            width={size}
            height={size}
            role="img"
            aria-label={`Score ${value} sur 100`}
        >

            {/* background */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={stroke}
                fill="none"
            />

            {/* progress */}
            <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${center} ${center})`}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />

            {/* text */}
            <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                style={{
                    fontSize: size * 0.25,
                    fontWeight: "bold",
                    fill: "#374151"
                }}
            >
                {value}
            </text>

        </svg>

    );
}