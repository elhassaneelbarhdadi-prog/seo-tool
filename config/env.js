import dotenv from "dotenv";

const result = dotenv.config();

/* ========================= */
/* ENV CHECK */
/* ========================= */

if (result.error) {

    console.error("❌ Impossible de charger .env");
    throw result.error;

}

if (process.env.NODE_ENV === "development") {

    console.log("📦 ENV LOADED");

    console.log("NODE_ENV:",
        process.env.NODE_ENV
    );

}

/* ========================= */
/* REQUIRED VARIABLES */
/* ========================= */

const requiredEnv = [

    "JWT_SECRET",

    "OPENAI_API_KEY",

    "STRIPE_SECRET_KEY"

];

const missing = requiredEnv.filter(
    key => !process.env[key]
);

if (missing.length > 0) {

    throw new Error(
        `Variables .env manquantes: ${missing.join(", ")}`
    );

}