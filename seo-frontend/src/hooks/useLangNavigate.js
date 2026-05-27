import { useNavigate, useLocation, useParams } from "react-router-dom";

export default function useLangNavigate() {

    const navigate = useNavigate();
    const location = useLocation();
    const { lang: paramLang } = useParams();

    /* ========================= */
    /* 🌍 GET LANG SAFE */
    /* ========================= */
    const getLang = () => {
        const pathLang = location.pathname.split("/")[1];

        return (
            paramLang ||
            pathLang ||
            localStorage.getItem("lang") ||
            "fr"
        );
    };

    /* ========================= */
    /* 🚀 NAVIGATE */
    /* ========================= */
    const go = (inputPath) => {

        if (!inputPath) return;

        let path =
            typeof inputPath === "function"
                ? inputPath()
                : inputPath;

        if (!path || typeof path !== "string") {
            console.error("❌ Invalid path:", path);
            return;
        }

        const lang = getLang();

        // nettoie path
        path = path.trim();

        /* ========================= */
        /* ✅ CAS 1 : déjà avec lang */
        /* ========================= */
        if (path.startsWith(`/${lang}/`)) {
            return navigate(path);
        }

        /* ========================= */
        /* ✅ CAS 2 : path absolu */
        /* ========================= */
        if (path.startsWith("/")) {
            return navigate(`/${lang}${path}`);
        }

        /* ========================= */
        /* ✅ CAS 3 : path relatif */
        /* ========================= */
        return navigate(`/${lang}/${path}`);
    };

    return { go };
}