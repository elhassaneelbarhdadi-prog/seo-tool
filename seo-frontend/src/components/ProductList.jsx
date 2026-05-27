export default function ProductList({ products }) {
    if (!products?.length) return null;

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-bold mb-4">🛒 Produits populaires</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p, i) => (
                    <a
                        key={i}
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border p-4 rounded-lg hover:shadow transition"
                    >
                        <img
                            src={p.thumbnail || "https://placehold.co/300x200"}
                            alt={p.title}
                            className="w-full h-32 object-cover mb-2 rounded"
                            onError={(e) => {
                                e.currentTarget.src = "https://placehold.co/300x200?text=Produit";
                            }}
                        />

                        <p className="font-semibold line-clamp-2">{p.title}</p>

                        <p className="text-green-600 font-bold">
                            {p.price ? `${p.price} €` : "—"}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}