export const usageMiddleware = (limit = 5) => {
    return (req, res, next) => {

        const used = req.user?.usage || 0;
        const plan = req.user?.plan || "FREE";

        // PRO → illimité
        if (plan !== "FREE") return next();

        // FREE → limite
        if (used >= limit) {
            return res.status(403).json({
                error: "LIMIT_REACHED",
                message: "Limite atteinte",
                upgrade: true
            });
        }

        next();
    };
};