import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadStats = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error("Token manquant");
                }

                const res = await fetch(`${API_BASE}/admin/stats`, {
                    headers: {
                        Authorization: "Bearer " + token
                    }
                });

                let data = null;
                try {
                    data = await res.json();
                } catch {
                    throw new Error("Réponse JSON invalide");
                }

                if (res.status === 401) {
                    throw new Error("Session expirée ou non autorisée");
                }

                if (res.status === 403) {
                    throw new Error("Accès refusé");
                }

                if (!res.ok) {
                    throw new Error(
                        data?.error || "Erreur chargement stats"
                    );
                }

                setStats(data);
            } catch (err) {
                console.error("ADMIN DASHBOARD:", err);
                setError(err.message || "Erreur inconnue");
            }
        };

        loadStats();
    }, []);

    if (error) {
        return (
            <div className="p-6 text-red-600">
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-6">
                Chargement...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
                📊 Admin Dashboard
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card
                    title="👥 Utilisateurs"
                    value={stats.users || 0}
                />

                <Card
                    title="🔍 Analyses"
                    value={stats.keywords || 0}
                />

                <Card
                    title="🤖 IA utilisées"
                    value={stats.ai || 0}
                />

                <Card
                    title="💰 Revenus estimés"
                    value={`${stats.revenue || 0}€`}
                />
            </div>

            <div className="mt-8 bg-white p-4 rounded shadow">
                <h2 className="font-bold mb-4">
                    Répartition des plans
                </h2>

                {(stats.plans || []).map((p, i) => (
                    <div
                        key={i}
                        className="flex justify-between"
                    >
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
            <h3 className="text-sm text-gray-500">
                {title}
            </h3>

            <p className="text-2xl font-bold">
                {value}
            </p>
        </div>
    );
}