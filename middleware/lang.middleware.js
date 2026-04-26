export const langMiddleware = (req, res, next) => {

    // 1. depuis header (prioritaire)
    const headerLang = req.headers["x-lang"];

    // 2. fallback navigateur
    const browserLang = req.headers["accept-language"]?.split(",")[0]?.split("-")[0];

    // 3. fallback défaut
    const supported = ["fr", "en", "es", "de"];

    const lang =
        headerLang ||
        (supported.includes(browserLang) ? browserLang : "fr");

    req.lang = lang;

    next();
};