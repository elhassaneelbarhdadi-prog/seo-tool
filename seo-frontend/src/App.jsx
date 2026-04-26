import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from "react-router-dom";

import { useEffect, useMemo } from "react";

/* LAYOUT */
import DashboardLayout from "./layout/DashboardLayout";

/* PAGES */
import Home from "./pages/Home";
import ProjectPage from "./pages/ProjectPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import KeywordAnalyzer from "./pages/KeywordAnalyzer";
import Pricing from "./pages/Pricing";
import NichesPage from "./pages/NichesPage";
import Annuaire from "./pages/Annuaire";
import BusinessProfile from "./pages/BusinessProfile";
import LandingKeyword from "./pages/LandingKeyword";
import AnnuairePage from "./pages/AnnuairePage";

/* COMPONENTS */
import ErrorBoundary from "./components/ErrorBoundary";

/* I18N */
import "./i18n";

/* ========================= */
/* 🔍 DEBUG ROUTER */
/* ========================= */
function DebugRouter() {
  const location = useLocation();

  useEffect(() => {
    console.log("📍 ROUTE:", location.pathname);
  }, [location]);

  return null;
}

/* ========================= */
/* 🌍 LANG DETECTION */
/* ========================= */
function getBrowserLang() {
  const saved = localStorage.getItem("lang");
  if (saved) return saved;

  const lang = navigator.language.split("-")[0];
  const supported = ["fr", "en", "es", "de"];

  return supported.includes(lang) ? lang : "fr";
}

/* ========================= */
/* 🔒 TOKEN VALIDATION (PURE) */
/* ========================= */
function isTokenValid(token) {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // ⚠️ calcul encapsulé (pas dans JSX direct)
    const now = Date.now();

    return payload.exp * 1000 > now;

  } catch {
    return false;
  }
}

/* ========================= */
/* 🔒 PROTECTED ROUTE */
/* ========================= */
function ProtectedRoute({ children }) {
  const { lang } = useParams();

  const token = localStorage.getItem("token");

  const isValid = useMemo(() => isTokenValid(token), [token]);

  if (!isValid) {
    localStorage.removeItem("token");
    return <Navigate to={`/${lang || "fr"}/login`} replace />;
  }

  return children;
}

/* ========================= */
/* 🔁 ANNuaire WRAPPER */
/* ========================= */
function AnnuaireWrapper() {
  const location = useLocation();
  return <AnnuairePage key={location.pathname} />;
}

/* ========================= */
/* ❌ 404 */
/* ========================= */
function NotFound() {
  const { lang } = useParams();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">❌ 404</h1>
      <p className="text-gray-500 mb-6">Page non trouvée</p>

      <a
        href={`/${lang || "fr"}`}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl"
      >
        Retour accueil
      </a>
    </div>
  );
}

/* ========================= */
/* 🚀 APP */
/* ========================= */
export default function App() {
  return (
    <ErrorBoundary>
      <Router>

        <DebugRouter />

        <Routes>

          {/* ROOT */}
          <Route
            path="/"
            element={<Navigate to={`/${getBrowserLang()}`} replace />}
          />

          {/* HOME */}
          <Route path="/:lang" element={<Home />} />

          {/* AUTH */}
          <Route path="/:lang/login" element={<Login />} />
          <Route path="/:lang/register" element={<Register />} />

          {/* SEO */}
          <Route path="/:lang/landing/:keyword" element={<LandingKeyword />} />
          <Route path="/:lang/projet/:keyword" element={<ProjectPage />} />
          <Route path="/:lang/annuaire/:slug" element={<AnnuaireWrapper />} />

          {/* DASHBOARD */}
          <Route
            path="/:lang/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="keywords" element={<KeywordAnalyzer />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="niches" element={<NichesPage />} />
            <Route path="annuaire" element={<Annuaire />} />
            <Route path="business-profile" element={<BusinessProfile />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>

      </Router>
    </ErrorBoundary>
  );
}