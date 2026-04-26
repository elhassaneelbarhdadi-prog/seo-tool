export default function ProductList({ products }) {
    if (!products?.length) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">🛒 Produits populaires</h2>

            <div className="grid md:grid-cols-2 gap-4">
                {products.map((p, i) => (
                    <a
                        key={i}
                        href={p.link}
                        target="_blank"
                        className="border p-4 rounded-lg hover:shadow"
                    >
                        {p.thumbnail && (
                            <img src={p.thumbnail} className="h-32 object-cover mb-2" />
                        )}

                        <p className="font-semibold">{p.title}</p>
                        <p className="text-green-600">{p.price}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}