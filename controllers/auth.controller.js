import jwt from "jsonwebtoken";
import db from "../config/database.js";

/* ========================= */
/* REGISTER */
/* ========================= */
export const register = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email et mot de passe requis"
            });
        }

        res.json({
            message: "Utilisateur enregistré"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erreur serveur"
        });

    }
};

/* ========================= */
/* LOGIN */
/* ========================= */
export const login = async (req, res) => {
    try {

        const { email } = req.body;

        if (email !== "test@test.com") {
            return res.status(401).json({
                error: "Identifiants invalides"
            });
        }

        const user = {
            id: 1,
            email: "test@test.com",
            plan: "PRO" // 🔥 TEST PRO
        };

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                plan: user.plan // ✅ IMPORTANT
            },
            process.env.JWT_SECRET || "dev-secret",
            { expiresIn: "7d" }
        );

        return res.json({
            token,
            user
        });

    } catch (err) {

        console.error("LOGIN ERROR:", err);

        return res.status(500).json({
            error: "Erreur serveur login"
        });
    }
};

/* ========================= */
/* GET USER */
/* ========================= */
export const getUser = (req, res) => {

    res.json({
        id: req.user?.id,
        email: req.user?.email,
        plan: req.user?.plan
    });

};