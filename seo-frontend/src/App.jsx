import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
  Link
} from "react-router-dom";

import { useEffect, useMemo } from "react";
import FreeAnalyzer from "./pages/FreeAnalyzer";
/* ========================= */
/* LAYOUT */
/* ========================= */
import DashboardLayout from "./layout/DashboardLayout";

/* ========================= */
/* PAGES */
/* ========================= */
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

/* ========================= */
/* COMPONENTS */
/* ========================= */
import ErrorBoundary from "./components/ErrorBoundary";

/* ========================= */
/* I18N */
/* ========================= */
import "./i18n";

/* ========================= */
/* 🌍 LANGS */
/* ========================= */
const SUPPORTED_LANGS = ["fr", "en", "es", "de"];

function getBrowserLang() {

  const saved =
    localStorage.getItem("lang");

  if (
    saved &&
    SUPPORTED_LANGS.includes(saved)
  ) {
    return saved;
  }

  const browserLang =
    navigator.language.split("-")[0];

  return SUPPORTED_LANGS.includes(browserLang)
    ? browserLang
    : "fr";
}

/* ========================= */
/* 🔒 TOKEN */
/* ========================= */
function isTokenValid(token) {

  if (!token) {
    return false;
  }

  try {

    const payload =
      JSON.parse(
        atob(token.split(".")[1])
      );

    return payload.exp * 1000 > Date.now();

  } catch {

    return false;

  }
}

/* ========================= */
/* 🔒 PROTECTED ROUTE */
/* ========================= */
function ProtectedRoute({ children }) {

  const { lang } = useParams();

  const token =
    localStorage.getItem("token");

  const isValid = useMemo(
    () => isTokenValid(token),
    [token]
  );

  if (!isValid) {

    localStorage.removeItem("token");

    return (
      <Navigate
        to={`/${lang || "fr"}/login`}
        replace
      />
    );
  }

  return children;
}

/* ========================= */
/* 🔁 ANNUAIRE WRAPPER */
/* ========================= */
function AnnuaireWrapper() {

  const location = useLocation();

  return (
    <AnnuairePage key={location.pathname} />
  );
}

/* ========================= */
/* ❌ NOT FOUND */
/* ========================= */
function NotFound() {

  const { lang } = useParams();

  return (

    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-50">

      <h1 className="text-6xl font-black mb-4">
        ❌ 404
      </h1>

      <p className="text-gray-500 text-lg mb-8">
        Page non trouvée
      </p>

      <Link
        to={`/${lang || "fr"}`}
        className="
          bg-indigo-600
          hover:bg-indigo-700
          transition
          text-white
          px-8
          py-4
          rounded-2xl
          font-semibold
        "
      >
        Retour accueil
      </Link>

    </div>

  );
}

/* ========================= */
/* 🚀 APP */
/* ========================= */
export default function App() {

  const defaultLang = useMemo(
    () => getBrowserLang(),
    []
  );

  return (

    <ErrorBoundary>

      <Router>

        {/* DEV ROUTER DEBUG */}
        {import.meta.env.DEV && (
          <DebugRouter />
        )}

        <Routes>

          {/* ROOT */}
          <Route
            path="/"
            element={
              <Navigate
                to={`/${defaultLang}`}
                replace
              />
            }
          />

          {/* ========================= */}
          {/* PUBLIC */}
          {/* ========================= */}

          {/* HOME */}
          <Route
            path="/:lang"
            element={<Home />}
          />

          {/* AUTH */}
          <Route
            path="/:lang/login"
            element={<Login />}
          />

          <Route
            path="/:lang/register"
            element={<Register />}
          />
          <Route
            path="/:lang/free-analyzer"
            element={<FreeAnalyzer />}
          />
          {/* SEO */}
          <Route
            path="/:lang/landing/:keyword"
            element={<LandingKeyword />}
          />

          <Route
            path="/:lang/projet/:keyword"
            element={<ProjectPage />}
          />

          <Route
            path="/:lang/annuaire/:slug"
            element={<AnnuaireWrapper />}
          />

          {/* ========================= */}
          {/* DASHBOARD */}
          {/* ========================= */}

          <Route
            path="/:lang/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            {/* DASHBOARD HOME */}
            <Route
              index
              element={<Dashboard />}
            />

            {/* KEYWORD ANALYZER */}
            <Route
              path="keywords"
              element={<KeywordAnalyzer />}
            />

            {/* PRICING */}
            <Route
              path="pricing"
              element={<Pricing />}
            />

            {/* NICHES */}
            <Route
              path="niches"
              element={<NichesPage />}
            />

            {/* ANNUAIRE */}
            {/* ANNUAIRE */}
            <Route
              path="annuaire"
              element={<Annuaire />}
            />
            {/* BUSINESS */}
            <Route
              path="business-profile"
              element={<BusinessProfile />}
            />

          </Route>

          {/* ========================= */}
          {/* 404 */}
          {/* ========================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>

      </Router>

    </ErrorBoundary>

  );
}

/* ========================= */
/* 🔍 DEBUG ROUTER */
/* ========================= */
function DebugRouter() {

  const location = useLocation();

  useEffect(() => {

    console.log(
      "📍 ROUTE:",
      location.pathname
    );

  }, [location]);

  return null;
}