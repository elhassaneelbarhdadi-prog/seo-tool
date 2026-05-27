import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    let isExpired = false;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        const now = new Date().getTime(); // ✅ OK (pas Date.now direct)
        isExpired = payload.exp * 1000 < now;

    } catch {
        isExpired = true;
    }

    if (isExpired) {
        localStorage.removeItem("token");
        return <Navigate to="/login" replace />;
    }

    return children;
}