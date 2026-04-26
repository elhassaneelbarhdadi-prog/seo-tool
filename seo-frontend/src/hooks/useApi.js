import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export default function useApi() {

    const navigate = useNavigate();
    const { lang } = useParams();

    const currentLang = lang || "fr";

    /* ========================= */
    /* 🔁 REQUEST (STABLE) */
    /* ========================= */
    const request = useCallback(async (url, options = {}, isPublic = false) => {

        const token = localStorage.getItem("token");

        try {

            const fullUrl = `http://localhost:3001/api${url}`;
            console.log("🚀 API CALL:", fullUrl);

            const headers = {
                "Content-Type": "application/json",
                ...(token && !isPublic && {
                    Authorization: `Bearer ${token}`
                })
            };

            const res = await fetch(fullUrl, {
                ...options,
                headers
            });

            /* ========================= */
            /* 🔒 AUTH HANDLING */
            /* ========================= */

            if (!isPublic && res.status === 401) {
                console.warn("🔒 Unauthorized");
                navigate(`/${currentLang}/login`);
                return null;
            }

            if (!isPublic && res.status === 403) {
                console.warn("💰 Limit reached → pricing");
                navigate(`/${currentLang}/dashboard/pricing`);
                return null;
            }

            /* ========================= */
            /* 📦 SAFE JSON */
            /* ========================= */

            let data = null;

            try {
                data = await res.json();
            } catch {
                console.warn("⚠️ No JSON response");
            }

            if (!res.ok) {
                console.error("❌ API ERROR RESPONSE:", data);
                throw new Error(data?.error || `HTTP ${res.status}`);
            }

            return data;

        } catch (err) {

            console.error("🔥 API ERROR:", err.message);
            throw err;

        }

    }, [navigate, currentLang]); // ✅ STABLE

    /* ========================= */
    /* 🚀 METHODS (STABLE) */
    /* ========================= */

    const api = useMemo(() => ({
        get: (url, isPublic = false) => request(url, {}, isPublic),

        post: (url, body, isPublic = false) =>
            request(url, {
                method: "POST",
                body: JSON.stringify(body)
            }, isPublic),

        del: (url) =>
            request(url, {
                method: "DELETE"
            })
    }), [request]); // ✅ STABLE

    return api;
} console.log("✅ useApi actif");