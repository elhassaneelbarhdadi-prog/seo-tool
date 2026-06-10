import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import db from "../config/database.js";

/* ========================= */
/* HELPERS */
/* ========================= */

const isValidEmail = (email) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

};

/* ========================= */
/* REGISTER */
/* ========================= */

export const register =
    async (req, res) => {

        try {

            let {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Email et mot de passe requis"

                    });

            }

            email =
                email
                    .trim()
                    .toLowerCase();

            if (
                !isValidEmail(email)
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Email invalide"

                    });

            }

            if (
                password.length < 8
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Minimum 8 caractères"

                    });

            }

            const existing =
                await db.get(

                    `
        SELECT id
        FROM users
        WHERE email=?
        `,

                    [email]

                );

            if (existing) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Email déjà utilisé"

                    });

            }

            const hashed =
                await bcrypt.hash(
                    password,
                    12
                );

            const result =
                await db.run(

                    `
        INSERT INTO users(

            email,
            password,
            plan,
            role

        )

        VALUES(

            ?,
            ?,
            'FREE',
            'user'

        )
        `,

                    [

                        email,

                        hashed

                    ]

                );

            return res.json({

                success: true,

                message:
                    "Utilisateur enregistré",

                userId:
                    result.lastID

            });

        }

        catch (error) {

            console.error(
                "REGISTER ERROR:",
                error.message
            );

            return res
                .status(500)
                .json({

                    error:
                        "Erreur serveur"

                });

        }

    };

/* ========================= */
/* LOGIN */
/* ========================= */

export const login =
    async (req, res) => {

        try {

            let {
                email,
                password
            } = req.body;

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Champs requis"

                    });

            }

            email =
                email
                    .trim()
                    .toLowerCase();

            const user =
                await db.get(

                    `

        SELECT

            id,

            email,

            password,

            role,

            plan,

            subscription_status

        FROM users

        WHERE email=?

        `,

                    [email]

                );

            if (
                !user ||
                !user.password
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Identifiants invalides"

                    });

            }

            const validPassword =

                await bcrypt.compare(

                    password,

                    user.password

                );

            if (
                !validPassword
            ) {

                return res
                    .status(401)
                    .json({

                        error:
                            "Identifiants invalides"

                    });

            }

            if (
                !process.env.JWT_SECRET
            ) {

                throw new Error(
                    "JWT_SECRET manquant"
                );

            }

            const token =
                jwt.sign(

                    {

                        id: user.id,

                        email: user.email,

                        role: user.role,

                        plan: user.plan,

                        subscription_status:
                            user.subscription_status

                    },

                    process.env.JWT_SECRET,

                    {

                        expiresIn: "7d"

                    }

                );

            return res.json({

                token,

                user: {

                    id:
                        user.id,

                    email:
                        user.email,

                    role:
                        user.role,

                    plan:
                        user.plan

                }

            });

        }

        catch (err) {

            console.error(
                "LOGIN ERROR:",
                err.message
            );

            return res
                .status(500)
                .json({

                    error:
                        "Erreur serveur login"

                });

        }

    };

/* ========================= */
/* GET USER */
/* ========================= */

export const getUser = async (req, res) => {

    try {

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
            `,
            [req.user.id]
        );

        if (!user) {

            return res.status(404).json({
                error: "User not found"
            });

        }

        return res.json(user);

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Server error"
        });

    }

};