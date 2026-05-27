import { useState } from "react";

export default function Annuaire() {

    const [search, setSearch] = useState("");

    const [businesses, setBusinesses] = useState([]);

    const loadBusinesses = async () => {

        try {

            const response = await fetch(

                `http://localhost:3001/api/business-profile?search=${search}`

            );

            const data = await response.json();

            console.log(data);

            setBusinesses(
                data.businesses || []
            );

        } catch (err) {

            console.error(
                "❌ LOAD BUSINESSES ERROR:",
                err
            );

        }

    };

    return (

        <div className="max-w-5xl mx-auto px-4 py-10">

            {/* TITLE */}

            <div className="text-center mb-10">

                <h1
                    className="
                        text-4xl
                        md:text-6xl
                        font-black
                    "
                >
                    📁 Annuaire SEO
                </h1>

                <p
                    className="
                        text-gray-500
                        mt-4
                        text-lg
                    "
                >
                    Découvrez les meilleures entreprises
                    référencées par catégorie et ville.
                </p>

            </div>

            {/* SEARCH */}

            <div
                className="
                    flex
                    flex-col
                    md:flex-row
                    gap-4
                    items-center
                    mb-10
                "
            >

                <input
                    type="text"
                    placeholder="Ex: plombier Paris"
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    className="
                        w-full
                        flex-1
                        border-2
                        border-black
                        rounded-full
                        px-6
                        py-5
                        text-lg
                    "
                />

                <button
                    onClick={loadBusinesses}
                    className="
                        w-full
                        md:w-auto
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        px-8
                        py-5
                        rounded-full
                        font-bold
                    "
                >
                    🔍 Rechercher
                </button>

            </div>
            <div className="mt-10 space-y-6">
                {businesses.map((business) => (

                    <div
                        key={business.id}
                        className="
                bg-white
                rounded-3xl
                shadow-md
                p-6
                border
            "
                    >

                        <h2 className="text-2xl font-bold">
                            {business.name}
                        </h2>

                        <p className="text-gray-500 mt-2">
                            📍 {business.city}
                        </p>

                        <p className="mt-4 text-gray-700">
                            {business.description}
                        </p>

                        <div className="mt-4 flex gap-2 flex-wrap">

                            <span
                                className="
                        bg-blue-100
                        text-blue-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                    "
                            >
                                {business.keyword}
                            </span>

                            <span
                                className="
                        bg-green-100
                        text-green-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                    "
                            >
                                SEO Score : {business.score}
                            </span>

                        </div>

                    </div>

                ))}
            </div>
            {/* RESULTS */}

            <div className="space-y-6">

                {businesses.length === 0 && (

                    <div className="text-center text-gray-400">

                        Aucun résultat

                    </div>

                )}

                {businesses.map((business) => (

                    <div
                        key={business.id}
                        className="
                            border
                            rounded-2xl
                            p-6
                            shadow-sm
                            bg-white
                        "
                    >

                        <h2 className="text-2xl font-bold">

                            {business.name}

                        </h2>

                        <p className="text-gray-500 mt-2">

                            📍 {business.city}

                        </p>

                        <p className="mt-4">

                            {business.description}

                        </p>

                    </div>

                ))}

            </div>

        </div>

    );

}