import { useEffect, useState } from "react";

export default function AdminDashboard() {

    const [stats, setStats] = useState(null);

    useEffect(() => {

        const loadStats = async () => {

            const API_URL =
                import.meta.env.VITE_API_URL ||
                "https://seo-tool-api-lo6k.onrender.com/api";

            const res = await fetch(
                `${API_URL}/...`
            );
            const data = await res.json();

            setStats(data);
        };

        loadStats();

    }, []);

    if (!stats) return <p>Chargement...</p>;

    return (

        <div className="p-6 max-w-4xl mx-auto">

            <h1 className="text-3xl font-bold mb-6">
                📊 Admin Dashboard
            </h1>

            {/* CARDS */}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                <Card title="👥 Utilisateurs" value={stats.users} />
                <Card title="🔍 Analyses" value={stats.keywords} />
                <Card title="🤖 IA utilisées" value={stats.ai} />
                <Card title="💰 Revenus estimés" value={stats.revenue + "€"} />

            </div>

            {/* PLANS */}

            <div className="mt-8 bg-white p-4 rounded shadow">

                <h2 className="font-bold mb-4">Répartition des plans</h2>

                {stats.plans.map((p, i) => (
                    <div key={i} className="flex justify-between">
                        <span>{p.plan}</span>
                        <span>{p.count}</span>
                    </div>
                ))}

            </div>

        </div>
    );
}

function Card({ title, value }) {
    return (
        <div className="bg-white p-4 rounded shadow text-center">
            <h3 className="text-sm text-gray-500">{title}</h3>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}