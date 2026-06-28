/* ========================= */
/* LOGGER V2 */
/* ========================= */

const DEBUG =
    process.env.DEBUG === "true" ||
    process.env.NODE_ENV === "development";

const timestamp = () => {

    return new Date().toISOString();

};

const write = (level, ...messages) => {

    const prefix = `[${timestamp()}] [${level}]`;

    console.log(prefix, ...messages);

};

const logger = {

    info(...messages) {

        write("INFO", ...messages);

    },

    success(...messages) {

        write("SUCCESS", ...messages);

    },

    warn(...messages) {

        write("WARN", ...messages);

    },

    error(...messages) {

        write("ERROR", ...messages);

    },

    debug(...messages) {

        if (!DEBUG) return;

        write("DEBUG", ...messages);

    }

};

export default logger;