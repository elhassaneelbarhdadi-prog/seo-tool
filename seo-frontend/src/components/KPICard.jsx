export default function KPICard({
    title,
    value,
    change, // ex: +12%
    positive = true,
    icon = null,
    loading = false
}) {

    const format = (val) => {
        if (val === null || val === undefined) return "-";

        if (typeof val === "number") {
            if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
            if (val >= 1_000) return (val / 1_000).toFixed(1) + "K";
        }

        return val;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-md transition">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-sm">
                    {title}
                </p>

                {icon && (
                    <span className="text-xl opacity-70">
                        {icon}
                    </span>
                )}
            </div>

            {/* VALUE */}
            <h2 className="text-3xl font-bold">
                {loading ? "..." : format(value)}
            </h2>

            {/* CHANGE */}
            {change && (
                <p
                    className={`text-sm mt-2 font-medium ${positive ? "text-green-600" : "text-red-500"
                        }`}
                >
                    {positive ? "▲" : "▼"} {change}
                </p>
            )}

        </div>
    );
}