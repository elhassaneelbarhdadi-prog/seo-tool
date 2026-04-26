export default function KeywordSuggestions({ suggestions = [], onSelect }) {

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return null;
    }

    return (

        <div className="mt-6 bg-white p-6 rounded-xl shadow">

            <h3 className="text-lg font-bold mb-4">
                Suggestions SEO
            </h3>

            <div className="flex flex-wrap gap-3">

                {suggestions.map((s, index) => {

                    // 🔥 SAFE KEYWORD EXTRACTION
                    const keyword =
                        typeof s === "string"
                            ? s
                            : s?.keyword || "";

                    return (
                        <button
                            key={index}
                            onClick={() => {
                                console.log("CLICK SUGGESTION 👉", keyword);

                                if (!keyword) return;

                                if (onSelect && typeof onSelect === "function") {
                                    onSelect(keyword);
                                }
                            }}
                            className="bg-gray-100 hover:bg-blue-100 text-sm px-3 py-1 rounded transition"
                        >
                            {keyword}
                        </button>
                    );
                })}

            </div>

        </div>

    );
}