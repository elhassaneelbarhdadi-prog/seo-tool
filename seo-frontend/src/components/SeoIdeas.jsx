export default function SeoIdeas({ ideas = [] }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="font-semibold mb-4">💡 Idées de contenu</h3>

            <ul className="space-y-2">
                {ideas.map((idea, i) => (
                    <li key={i} className="flex items-center gap-2">
                        ✅ <span>{idea}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}