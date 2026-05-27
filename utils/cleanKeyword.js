export const cleanKeyword = (str = "") => {

    if (!str) return "";

    let value = str
        .toLowerCase()

        /* accents */
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")

        /* apostrophes → espace */
        .replace(/['’]/g, " ")

        /* caractères spéciaux */
        .replace(/[^a-z0-9\s-]/g, " ")

        /* tirets → espace */
        .replace(/-/g, " ")

        /* espaces multiples */
        .replace(/\s+/g, " ")
        .trim();

    /* ========================= */
    /* 🔥 STOP WORDS CLEAN */
    /* ========================= */
    const stopWords = [
        "a", "à", "de", "du", "des",
        "le", "la", "les", "un", "une"
    ];

    const words = value.split(" ").filter(Boolean);

    /* enlever stopwords au début */
    while (words.length && stopWords.includes(words[0])) {
        words.shift();
    }

    return words.join(" ");
};