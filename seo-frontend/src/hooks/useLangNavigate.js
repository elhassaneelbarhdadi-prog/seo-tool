import { useNavigate } from "react-router-dom";

export default function useLangNavigate() {

    const navigate = useNavigate();

    const getLang = () => {
        const pathLang = window.location.pathname.split("/")[1];
        return pathLang || localStorage.getItem("lang") || "fr";
    };

    const go = (path) => {

        if (!path) return;

        // si fonction → exécute
        if (typeof path === "function") {
            path = path();
        }

        if (typeof path !== "string") {
            console.error("❌ path invalide:", path);
            return;
        }

        const lang = getLang();

        // ✅ SI déjà /fr/... → on ne touche pas
        if (path.startsWith(`/${lang}/`)) {
            navigate(path);
            return;
        }

        // ✅ SI path commence par /dashboard
        if (path.startsWith("/dashboard")) {
            navigate(`/${lang}${path}`);
            return;
        }

        // fallback
        navigate(`/${lang}/${path.replace(/^\/+/, "")}`);
    };

    return { go };
}