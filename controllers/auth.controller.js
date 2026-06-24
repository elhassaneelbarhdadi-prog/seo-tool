import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../config/database.js";

/* ========================= */
/* HELPERS */
/* ========================= */

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ========================= */
/* REGISTER */
/* ========================= */

export const register = async (req, res) => {
    try {
        let { email, password } = req.body;

        console.log("📥 REGISTER BODY:", {
            email,
            passwordLength: password?.length || 0
        });

        if (!email || !password) {
            console.log("❌ REGISTER REFUSED: missing email or password");

            return res.status(400).json({
                error: "Email et mot de passe requis"
            });
        }

        email = email.trim().toLowerCase();

        if (!isValidEmail(email)) {
            console.log("❌ REGISTER REFUSED: invalid email", email);

            return res.status(400).json({
                error: "Email invalide"
            });
        }

        if (password.length < 8) {
            console.log("❌ REGISTER REFUSED: password too short", {
                email,
                passwordLength: password.length
            });

            return res.status(400).json({
                error: "Minimum 8 caractères"
            });
        }

        const existing = await db.get(
            `
            SELECT id
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (existing) {
            console.log("❌ REGISTER REFUSED: email already used", {
                email,
                existingUserId: existing.id
            });

            return res.status(400).json({
                error: "Email déjà utilisé"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET manquant");
        }

        const hashed = await bcrypt.hash(password, 12);

        const result = await db.run(
            `
            INSERT INTO users(
                email,
                password,
                plan,
                role,
                subscription_status
            )
            VALUES(
                ?,
                ?,
                'FREE',
                'user',
                'inactive'
            )
            `,
            [email, hashed]
        );

        const userId = result.lastID;

        console.log("✅ NEW USER CREATED:", {
            id: userId,
            email,
            plan: "FREE",
            role: "user",
            subscription_status: "inactive"
        });

        const token = jwt.sign(
            {
                id: userId,
                email,
                role: "user",
                plan: "FREE",
                subscription_status: "inactive"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            success: true,
            token,
            user: {
                id: userId,
                email,
                role: "user",
                plan: "FREE",
                subscription_status: "inactive"
            }
        });
    } catch (error) {
        console.error("🔥 REGISTER ERROR:", error);

        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
};

/* ========================= */
/* LOGIN */
/* ========================= */

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        console.log("📥 LOGIN BODY:", {
            email,
            passwordLength: password?.length || 0
        });

        if (!email || !password) {
            console.log("❌ LOGIN REFUSED: missing email or password");

            return res.status(400).json({
                error: "Champs requis"
            });
        }

        email = email.trim().toLowerCase();

        const user = await db.get(
            `
            SELECT
                id,
                email,
                password,
                role,
                plan,
                subscription_status
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        if (!user || !user.password) {
            console.log("❌ LOGIN REFUSED: user not found", {
                email
            });

            return res.status(401).json({
                error: "Identifiants invalides"
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            console.log("❌ LOGIN REFUSED: wrong password", {
                userId: user.id,
                email: user.email
            });

            return res.status(401).json({
                error: "Identifiants invalides"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET manquant");
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                plan: user.plan,
                subscription_status: user.subscription_status
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        console.log("✅ LOGIN SUCCESS:", {
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan,
            subscription_status: user.subscription_status
        });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                plan: user.plan,
                subscription_status: user.subscription_status
            }
        });
    } catch (err) {
        console.error("🔥 LOGIN ERROR:", err);

        return res.status(500).json({
            error: "Erreur serveur login"
        });
    }
};

/* ========================= */
/* GET USER */
/* ========================= */

export const getUser = async (req, res) => {
    try {
        console.log("📥 GET USER req.user =", req.user);

        const user = await db.get(
            `
            SELECT
                id,
                email,
                role,
                plan,
                subscription_status
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [req.user.id]
        );

        if (!user) {
            console.log("❌ GET USER: user not found", {
                requestedId: req.user?.id
            });

            return res.status(404).json({
                error: "User not found"
            });
        }

        console.log("✅ GET USER SUCCESS:", user);

        return res.json(user);
    } catch (error) {
        console.error("🔥 GET USER ERROR:", error);

        return res.status(500).json({
            error: "Server error"
        });
    }
};