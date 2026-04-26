import ScoreCircle from "./ScoreCircle";
import DifficultyCircle from "./DifficultyCircle";

export default function SeoOverview({ result }) {

    if (!result) return null;

    const score = Number(result.score) || 0;
    const difficulty = Number(result.difficulty) || 0;
    const volume = Number(result.volume) || 0;
    const revenue = Number(result.revenue) || 0;

    /* ========================= */
    /* 🧠 LABELS INTELLIGENTS */
    /* ========================= */
    const getOpportunity = () => {
        if (score >= 70) return { text: "Forte opportunité", color: "text-green-600" };
        if (score >= 40) return { text: "Opportunité moyenne", color: "text-yellow-500" };
        return { text: "Faible opportunité", color: "text-red-500" };
    };

    const getDifficultyLabel = () => {
        if (difficulty >= 70) return { text: "Très difficile", color: "text-red-500" };
        if (difficulty >= 40) return { text: "Moyenne", color: "text-yellow-500" };
        return { text: "Facile", color: "text-green-600" };
    };

    const opportunity = getOpportunity();
    const difficultyLabel = getDifficultyLabel();

    /* ========================= */
    /* 🎨 UI */
    /* ========================= */
    return (
        <div className="bg-white p-6 rounded-2xl shadow space-y-6">

            <h2 className="text-xl font-bold">
                📊 Analyse rapide
            </h2>

            {/* 🔢 CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* SCORE */}
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Opportunité</p>
                    <ScoreCircle score={score} />
                    <p className={`text-xs mt-2 ${opportunity.color}`}>
                        {opportunity.text}
                    </p>
                </div>

                {/* DIFFICULTY */}
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Concurrence</p>
                    <DifficultyCircle difficulty={difficulty} />
                    <p className={`text-xs mt-2 ${difficultyLabel.color}`}>
                        {difficultyLabel.text}
                    </p>
                </div>

                {/* VOLUME */}
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Recherches</p>
                    <p className="text-2xl font-bold">
                        {volume.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">par mois</p>
                </div>

                {/* REVENUE */}
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                    <p className="text-sm text-gray-500">Potentiel €</p>
                    <p className="text-2xl font-bold text-green-600">
                        {revenue.toLocaleString()}€
                    </p>
                    <p className="text-xs text-gray-400">estimé</p>
                </div>

            </div>

            {/* 🧠 INTERPRÉTATION SIMPLE */}
            <div className="bg-blue-50 p-4 rounded-xl text-sm">

                {score >= 70 && difficulty < 50 && (
                    <p className="text-green-700 font-medium">
                        ✅ Très bon mot-clé : facile à ranker + rentable
                    </p>
                )}

                {score >= 40 && score < 70 && (
                    <p className="text-yellow-700 font-medium">
                        ⚠️ Opportunité correcte : nécessite du contenu solide
                    </p>
                )}

                {difficulty >= 70 && (
                    <p className="text-red-700 font-medium">
                        🚨 Forte concurrence : stratégie SEO avancée requise
                    </p>
                )}

                {score < 30 && (
                    <p className="text-red-700 font-medium">
                        ❌ Peu intéressant : faible potentiel business
                    </p>
                )}

            </div>

        </div>
    );
}