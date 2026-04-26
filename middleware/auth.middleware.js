import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {

    try {

        /* 🔒 CHECK HEADER */
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        /* 🔑 TOKEN */
        const token = authHeader.split(" ")[1];

        if (!process.env.JWT_SECRET) {
            console.error("❌ JWT_SECRET manquant");
            return res.status(500).json({
                error: "Server misconfiguration"
            });
        }

        /* 🔍 VERIFY */
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /* 🔒 BASIC VALIDATION */
        if (!decoded?.id) {
            return res.status(401).json({
                error: "Invalid token payload"
            });
        }

        /* 🔥 ATTACH USER */
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            plan: decoded.plan
        };

        next();

    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                error: "Token expired"
            });
        }

        return res.status(401).json({
            error: "Invalid token"
        });
    }
};