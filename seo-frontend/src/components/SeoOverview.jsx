import ScoreCircle from "./ScoreCircle";
import DifficultyCircle from "./DifficultyCircle";
import { formatNumber } from "../utils/format";


export default function SeoOverview({ result }) {

    if (!result) return null;

    const score = Number(result.score) || 0;
    const difficulty = Number(result.competition ?? result.difficulty) || 0;
    const volume = Number(result.volume) || 0;
    const cpc = Number(result.cpc) || 0;

    const revenueRaw = Number(result.revenue) || 0;

    const revenue =
        revenueRaw > 0
            ? `${formatNumber(revenueRaw)}€`
            : "—";
    /* ========================= */
    /* 📈 REAL SEO TREND */
    /* ========================= */




    const opportunity =
        score >= 70
            ? { text: "Forte opportunité", color: "text-green-600" }
            : score >= 40
                ? { text: "Opportunité moyenne", color: "text-yellow-500" }
                : { text: "Faible opportunité", color: "text-red-500" };

    const difficultyLabel =
        difficulty >= 70
            ? { text: "Très difficile", color: "text-red-500" }
            : difficulty >= 40
                ? { text: "Moyenne", color: "text-yellow-500" }
                : { text: "Facile", color: "text-green-600" };

    return (
        <div className="bg-white p-6 rounded-2xl shadow space-y-6">

            <h2 className="text-xl font-bold">
                📊 Analyse rapide
            </h2>

            {/* 🔥 7 colonnes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">

                {/* SCORE */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Opportunité</p>
                    <ScoreCircle score={score} />
                    <p className={`text-xs mt-2 ${opportunity.color}`}>
                        {opportunity.text}
                    </p>
                </div>

                {/* DIFFICULTY */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Concurrence</p>
                    <DifficultyCircle difficulty={difficulty} />
                    <p className={`text-xs mt-2 ${difficultyLabel.color}`}>
                        {difficultyLabel.text}
                    </p>
                </div>

                {/* VOLUME */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Recherches</p>
                    <p className="text-2xl font-bold">
                        {formatNumber(volume)}
                    </p>
                    <p className="text-xs text-gray-400">par mois</p>
                </div>

                {/* CPC 🔥 NOUVEAU */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">CPC</p>
                    <p className="text-2xl font-bold text-blue-600">
                        {cpc.toFixed(2)}€
                    </p>
                    <p className="text-xs text-gray-400">coût par clic</p>
                </div>

                {/* REVENUE */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">CA estimé</p>
                    <p className="text-2xl font-bold text-green-600">
                        {revenue}
                    </p>
                    <p className="text-xs text-gray-400">potentiel</p>
                </div>

                {/* TRAFIC */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Trafic #1</p>
                    <p className="text-2xl font-bold text-indigo-600">
                        {formatNumber(result?.trafficPosition1 || 0)}
                    </p>
                    <p className="text-xs text-gray-400">position 1</p>
                </div>

                {/* ROI */}
                <div className="bg-gray-50 p-5 rounded-xl text-center">
                    <p className="text-sm text-gray-500">ROI SEO</p>
                    <p className="text-2xl font-bold text-green-600">
                        {formatNumber(result?.roiScore || 0)}€
                    </p>
                    <p className="text-xs text-gray-400">rentabilité</p>
                </div>

            </div>

        </div>
    );
}