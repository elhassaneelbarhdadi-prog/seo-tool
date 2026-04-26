import { useMemo } from "react";

export default function UsageBar({ used = 0, limit = 1 }) {

    /* ========================= */
    /* 🔐 SAFE VALUES */
    /* ========================= */
    const safeUsed = Math.max(0, Number(used) || 0);
    const safeLimit = limit === Infinity ? Infinity : Math.max(1, Number(limit) || 1);

    /* ========================= */
    /* 📊 CALCUL */
    /* ========================= */
    const percent = useMemo(() => {
        if (safeLimit === Infinity) return 0;
        return Math.min((safeUsed / safeLimit) * 100, 100);
    }, [safeUsed, safeLimit]);

    /* ========================= */
    /* 🎨 COLOR */
    /* ========================= */
    const color = useMemo(() => {
        if (percent >= 100) return "bg-red-500";
        if (percent >= 70) return "bg-orange-400";
        return "bg-blue-500";
    }, [percent]);

    /* ========================= */
    /* UI */
    /* ========================= */
    return (
        <div className="w-full">

            <div className="flex justify-between text-sm mb-1">
                <span>Utilisation</span>
                <span>
                    {safeUsed} / {safeLimit === Infinity ? "∞" : safeLimit}
                </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

                <div
                    className={`h-3 ${color} transition-all duration-500`}
                    style={{
                        width: `${percent}%`,
                        minWidth: percent > 0 ? "6px" : "0px" // 👈 UX bonus
                    }}
                />

            </div>

        </div>
    );
}