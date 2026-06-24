const RAW_BASE =
    import.meta.env.VITE_API_URL ||
    "https://seo-tool-api-lo6k.onrender.com";

export const API_BASE = RAW_BASE.endsWith("/api")
    ? RAW_BASE
    : `${RAW_BASE}/api`;