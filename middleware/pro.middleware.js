import jwt from "jsonwebtoken";

const proMiddleware = (req, res, next) => {

    try {

        console.log("PRO MIDDLEWARE CALLED");

        // 1️⃣ Récupérer le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: "Token manquant"
            });
        }

        // 2️⃣ Extraire le token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Token invalide"
            });
        }

        // 3️⃣ Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("DECODED USER:", decoded);

        // 4️⃣ Vérifier si user PRO
        if (!decoded.isPro) {
            return res.status(403).json({
                error: "Accès réservé aux utilisateurs PRO"
            });
        }

        // 5️⃣ Ajouter user dans request
        req.user = decoded;

        // 6️⃣ Continuer
        next();

    } catch (error) {

        console.error("PRO MIDDLEWARE ERROR:", error.message);

        return res.status(401).json({
            error: "Token invalide"
        });

    }

};

export default proMiddleware;
