import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

/* ========================= */
/* 🌍 CONFIG */
/* ========================= */
const supported = ["fr", "en", "es", "de"];

/* ========================= */
/* 🔍 DETECT LANG (SMART) */
/* ========================= */
const getInitialLang = () => {
    const saved = localStorage.getItem("lang");

    if (saved && supported.includes(saved)) {
        return saved;
    }

    const browserLang = navigator.language.split("-")[0];

    if (supported.includes(browserLang)) {
        return browserLang;
    }

    return "fr";
};

/* ========================= */
/* 🚀 INIT */
/* ========================= */
i18n
    .use(initReactI18next)
    .init({
        resources: {
            fr: { translation: fr },
            en: { translation: en },
            es: { translation: es },
            de: { translation: de }
        },

        lng: getInitialLang(),
        fallbackLng: "fr",
        supportedLngs: supported,

        load: "languageOnly",
        cleanCode: true,

        interpolation: {
            escapeValue: false
        },

        returnNull: false,
        returnEmptyString: false,

        /* ========================= */
        /* 🔥 FIX CONSOLE SPAM */
        /* ========================= */
        debug: false,                 // ❌ stop logs
        saveMissing: false,           // ❌ stop missingKey spam
        missingKeyHandler: () => { }, // ❌ silence total

        /* BONUS UX */
        parseMissingKeyHandler: (key) => key // affiche la clé au lieu de vide
    });

/* ========================= */
/* 🔁 SYNC LOCALSTORAGE */
/* ========================= */
i18n.on("languageChanged", (lng) => {
    localStorage.setItem("lang", lng);
});

export default i18n;