import { Outlet, useParams, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export default function DashboardLayout() {

    const { lang } = useParams();
    const { t, i18n } = useTranslation();

    const currentLang = lang || localStorage.getItem("lang") || "fr";

    /* ========================= */
    /* 🌍 SYNC LANG */
    /* ========================= */
    useEffect(() => {
        if (i18n.language !== currentLang) {
            i18n.changeLanguage(currentLang);
            localStorage.setItem("lang", currentLang);
        }
    }, [currentLang, i18n]);

    /* ========================= */
    /* 🔒 LOGOUT */
    /* ========================= */
    const logout = () => {
        localStorage.clear();
        window.location.href = `/${currentLang}/login`;
    };

    /* ========================= */
    /* 📋 MENU */
    /* ========================= */
    const menuItems = [
        // 🏠 ACCUEIL (AJOUT ICI)
        {
            key: "home",
            icon: "🏠",
            label: "Accueil",
            route: `/${currentLang}`, // ⚠️ route absolue (important)
            isAbsolute: true
        },

        { key: "dashboard", icon: "📊", label: t("dashboard"), route: "" },
        { key: "keywords", icon: "🔍", label: t("keywords"), route: "keywords" },
        { key: "niches", icon: "🤖", label: t("niches"), route: "niches" },
        { key: "annuaire", icon: "📂", label: t("annuaire"), route: "annuaire" },
        { key: "business", icon: "🏢", label: t("business"), route: "business-profile" },
        { key: "pricing", icon: "💰", label: t("pricing"), route: "pricing" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">

            {/* SIDEBAR */}
            <div className="w-64 bg-white flex flex-col shadow">

                {/* LOGO */}
                <div className="p-4 font-bold text-lg border-b">
                    🚀 SEO Tool
                </div>

                {/* MENU */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">

                    {menuItems.map((item) => {

                        // 🔥 FIX : gérer route absolue vs relative
                        const fullPath = item.isAbsolute
                            ? item.route
                            : `/${currentLang}/dashboard/${item.route}`;

                        return (
                            <NavLink
                                key={item.key}
                                to={fullPath}
                                end={item.route === "" || item.isAbsolute}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded transition 
                                    ${isActive
                                        ? "bg-blue-100 font-semibold text-blue-600"
                                        : "hover:bg-gray-100"
                                    }`
                                }
                            >
                                {item.icon} {item.label}
                            </NavLink>
                        );
                    })}

                </div>

                {/* FOOTER */}
                <div className="p-4 border-t">
                    <button
                        onClick={logout}
                        className="w-full border border-red-500 text-red-500 py-2 rounded hover:bg-red-50 transition"
                    >
                        {t("logout")}
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
                <Outlet />
            </div>
        </div>
    );
}