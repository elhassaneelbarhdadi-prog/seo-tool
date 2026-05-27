import {
    Outlet,
    NavLink,
    useNavigate,
    useParams
} from "react-router-dom";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

export default function DashboardLayout() {

    const { lang } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentLang =
        lang ||
        localStorage.getItem("lang") ||
        "fr";

    /* ========================= */
    /* 🌍 SYNC LANG */
    /* ========================= */

    useEffect(() => {

        if (i18n.language !== currentLang) {

            i18n.changeLanguage(currentLang);

            localStorage.setItem(
                "lang",
                currentLang
            );

        }

    }, [currentLang, i18n]);

    /* ========================= */
    /* 🔒 LOGOUT */
    /* ========================= */

    const logout = () => {

        localStorage.removeItem("token");

        navigate(
            `/${currentLang}/login`
        );

    };

    /* ========================= */
    /* 📋 MENU */
    /* ========================= */

    const menuItems = useMemo(() => ([

        {
            key: "home",
            icon: "🏠",
            label: "Accueil",
            route: `/${currentLang}`,
            isAbsolute: true
        },

        {
            key: "dashboard",
            icon: "📊",
            label: t("dashboard"),
            route: ""
        },

        {
            key: "keywords",
            icon: "🔍",
            label: t("keywords"),
            route: "keywords"
        },

        {
            key: "niches",
            icon: "🤖",
            label: t("niches"),
            route: "niches"
        },

        {
            key: "annuaire",
            icon: "📂",
            label: t("annuaire"),
            route: "annuaire"
        },

        {
            key: "business",
            icon: "🏢",
            label: t("business"),
            route: "business-profile"
        },

        {
            key: "pricing",
            icon: "💰",
            label: t("pricing"),
            route: "pricing"
        }

    ]), [t, currentLang]);

    return (

        <div className="
            flex
            h-screen
            overflow-hidden
            bg-[#f5f7fb]
            min-w-0
        ">

            {/* ========================= */}
            {/* MOBILE OVERLAY */}
            {/* ========================= */}

            {sidebarOpen && (

                <div
                    onClick={() => setSidebarOpen(false)}
                    className="
                        fixed
                        inset-0
                        bg-black/40
                        z-40
                        lg:hidden
                    "
                />

            )}

            {/* ========================= */}
            {/* SIDEBAR */}
            {/* ========================= */}

            <aside
                className={`
                    fixed
                    lg:relative
                    inset-y-0
                    left-0
                    z-50
                    w-[220px]
                    lg:w-[240px]
                    min-w-[220px]
                    bg-white
                    border-r
                    border-gray-100
                    shadow-sm
                    flex
                    flex-col
                    transition-transform
                    duration-300
                    overflow-hidden
                    shrink-0
                    ${sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                    }
                `}
            >

                {/* LOGO */}

                <div className="
                    h-16
                    shrink-0
                    flex
                    items-center
                    px-6
                    border-b
                    border-gray-100
                    font-bold
                    text-2xl
                    overflow-hidden
                ">
                    <span className="truncate">
                        🚀 SEO Tool
                    </span>
                </div>

                {/* MENU */}

                <nav className="
                    flex-1
                    overflow-y-auto
                    overflow-x-hidden
                    p-4
                    space-y-2
                    min-w-0
                ">

                    {menuItems.map((item) => {

                        const fullPath =
                            item.isAbsolute
                                ? item.route
                                : `/${currentLang}/dashboard/${item.route}`;

                        return (

                            <NavLink
                                key={item.key}
                                to={fullPath}
                                end={
                                    item.route === "" ||
                                    item.isAbsolute
                                }
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => `
                                    flex
                                    items-center
                                    gap-3
                                    px-4
                                    py-3
                                    rounded-2xl
                                    transition-all
                                    duration-300
                                    text-sm
                                    font-semibold
                                    overflow-hidden
                                    min-w-0
                                    ${isActive
                                        ? "bg-indigo-100 text-indigo-600 shadow-sm"
                                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                    }
                                `}
                            >

                                <span className="
                                    text-2xl
                                    shrink-0
                                ">
                                    {item.icon}
                                </span>

                                <span className="
                                    truncate
                                    min-w-0
                                ">
                                    {item.label}
                                </span>

                            </NavLink>

                        );

                    })}

                </nav>

                {/* FOOTER */}

                <div className="
                    p-4
                    border-t
                    border-gray-100
                    shrink-0
                ">

                    <button
                        onClick={logout}
                        className="
                            w-full
                            rounded-2xl
                            border
                            border-red-200
                            bg-white
                            py-3
                            text-red-500
                            text-sm
                            font-semibold
                            transition-all
                            duration-300
                            hover:bg-red-50
                            hover:shadow-md
                        "
                    >
                        {t("logout")}
                    </button>

                </div>

            </aside>

            {/* ========================= */}
            {/* MAIN */}
            {/* ========================= */}

            <div className="
                flex-1
                flex
                flex-col
                overflow-hidden
                min-w-0
                w-0
            ">

                {/* ========================= */}
                {/* TOPBAR */}
                {/* ========================= */}

                <header className="
                    h-16
                    shrink-0
                    bg-white/90
                    backdrop-blur
                    border-b
                    border-gray-100
                    shadow-sm
                    flex
                    items-center
                    justify-between
                    px-4
                    sm:px-6
                    min-w-0
                ">

                    {/* LEFT */}

                    <div className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                        overflow-hidden
                    ">

                        {/* MOBILE MENU */}

                        <button
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                            className="
                                lg:hidden
                                text-2xl
                                shrink-0
                            "
                        >
                            ☰
                        </button>

                        <h1 className="
                            text-xl
                            sm:text-2xl
                            font-bold
                            tracking-tight
                            truncate
                        ">
                            Dashboard
                        </h1>

                    </div>

                    {/* RIGHT */}

                    <div className="
                        flex
                        items-center
                        gap-3
                        shrink-0
                    ">

                        <span className="
                            px-4
                            py-1.5
                            rounded-full
                            bg-indigo-100
                            text-indigo-600
                            text-xs
                            font-bold
                            shrink-0
                        ">
                            PRO
                        </span>

                        <div className="
                            w-10
                            h-10
                            rounded-full
                            bg-indigo-500
                            text-white
                            flex
                            items-center
                            justify-center
                            text-sm
                            font-bold
                            shadow-sm
                            shrink-0
                        ">
                            U
                        </div>

                    </div>

                </header>

                {/* ========================= */}
                {/* CONTENT */}
                {/* ========================= */}

                <main className="
                    flex-1
                    overflow-y-auto
                    overflow-x-hidden
                    bg-[#f5f7fb]
                    min-w-0
                ">

                    <div className="
                        w-full
                        max-w-[1400px]
                        mx-auto
                        px-4
                        sm:px-5
                        xl:px-6
                        py-4
                        sm:py-5
                        min-w-0
                        overflow-hidden
                    ">

                        <Outlet />

                    </div>

                </main>

            </div>

        </div>

    );

}