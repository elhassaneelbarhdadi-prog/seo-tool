import {
    RadialBarChart,
    RadialBar,
    ResponsiveContainer
} from "recharts";

export default function SeoGauge({ value = 0 }) {

    const data = [{ name: "SEO", value }];

    return (
        <div className="bg-white p-6 rounded-xl shadow text-center">

            <h2 className="font-bold mb-4">
                ⚔️ Difficulté SEO
            </h2>

            <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={data}
                    startAngle={180}
                    endAngle={0}
                >
                    <RadialBar
                        dataKey="value"
                        fill="#22c55e" // ✅ IMPORTANT (couleur)
                        cornerRadius={10}
                    />
                </RadialBarChart>
            </ResponsiveContainer>

            <p className="text-xl font-bold mt-2">
                {value}/100
            </p>

        </div>
    );
}