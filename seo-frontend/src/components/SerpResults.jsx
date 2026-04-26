export default function SerpResults({ serp }) {
    if (!serp?.length) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">🌍 Concurrence Google</h2>

            <div className="space-y-3">
                {serp.map((s, i) => (
                    <a
                        key={i}
                        href={s.link}
                        target="_blank"
                        className="block border p-3 rounded hover:bg-gray-50"
                    >
                        <p className="font-semibold">{s.title}</p>
                        <p className="text-sm text-gray-500">{s.link}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}