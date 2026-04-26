
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

export default function KeywordChart({ result }) {

    /* ========================= */
    /* 🧠 FORMAT NUMBER */
    /* ========================= */
    const formatNumber = (num) => {
        if (!num) return 0;

        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
        if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";

        return num;
    };

    /* ========================= */
    /* 📅 MOIS PROPRES */
    /* ========================= */
    const MONTHS_FR = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ];

    const getLast12Months = () => {
        const now = new Date();

        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(
                now.getFullYear(),
                now.getMonth() - (11 - i)
            );
            return MONTHS_FR[d.getMonth()];
        });
    };

    const months = getLast12Months();

    /* ========================= */
    /* SAFE CHECK */
    /* ========================= */
    if (!result?.trend) {
        return (
            <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-400 text-sm">
                    Aucune donnée de tendance disponible
                </p>
            </div>
        );
    }

    /* ========================= */
    /* FORMAT DATA */
    /* ========================= */
    let chartData = [];

    if (Array.isArray(result.trend)) {

        // 🔥 CAS 1 : [10,20,30]
        if (typeof result.trend[0] === "number") {
            chartData = result.trend.map((value, index) => ({
                name: months[index] || `M${index + 1}`,
                volume: value
            }));
        }

        // 🔥 CAS 2 : [{month, volume}]
        else if (typeof result.trend[0] === "object") {
            chartData = result.trend.map((item, index) => ({
                name: item.month || months[index] || `M${index + 1}`,
                volume: Number(item.volume) || 0
            }));
        }
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl shadow">
                <p className="text-gray-400 text-sm">
                    Données de tendance invalides
                </p>
            </div>
        );
    }

    /* ========================= */
    /* 🎨 UI */
    /* ========================= */
    return (
        <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="text-xl font-bold mb-4">
                📈 Tendance de recherche
            </h2>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                    />

                    <YAxis
                        tickFormatter={formatNumber}
                        width={50}
                    />

                    <Tooltip
                        formatter={(value) => formatNumber(value)}
                    />

                    <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                    />

                </LineChart>
            </ResponsiveContainer>

        </div>
    );
}