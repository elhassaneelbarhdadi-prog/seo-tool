import db from "../config/database.js";

async function seed() {

    try {

        await db.run(

            `
            INSERT INTO business_profiles (
                user_id,
                name,
                description,
                keyword,
                city,
                score
            )

            VALUES
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?)
            `,
            [

                1,

                "Médecine Traditionnelle Hijama",

                "Centre spécialisé en hijama et médecine traditionnelle.",

                "hijama",

                "Guesnain",

                95,

                1,

                "Haaroon Boutique",

                "Boutique spécialisée dans les articles de bien-être.",

                "bien-être",

                "Guesnain",

                90,

                1,

                "Cabinet Sunnah Bien-Être",

                "Accompagnement naturel et relaxation.",

                "bien-être naturel",

                "Guesnain",

                88

            ]

        );

        console.log(
            "✅ Businesses seeded"
        );

        process.exit();

    }

    catch (err) {

        console.error(err);

        process.exit(1);

    }

}

seed();