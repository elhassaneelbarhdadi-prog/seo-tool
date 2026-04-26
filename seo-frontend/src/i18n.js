import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";

/* ========================= */
/* 🌍 LANG INIT */
/* ========================= */
const savedLang = localStorage.getItem("lang");

const supported = ["fr", "en", "es", "de"];

// fallback safe
const initialLang = supported.includes(savedLang) ? savedLang : "fr";

/* ========================= */
/* 🚀 INIT I18N */
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

        lng: initialLang,
        fallbackLng: "fr",

        supportedLngs: supported,

        // 🔥 IMPORTANT pour éviter bugs langue
        load: "languageOnly",
        cleanCode: true,

        interpolation: {
            escapeValue: false // React safe
        },

        // 🔥 IMPORTANT pour tes {{variables}}
        returnNull: false,
        returnEmptyString: false,

        // 🔥 DEBUG (désactive en prod)
        debug: false
    });

export default i18n;