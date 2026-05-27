export const cleanKeyword = (str = "") => {

    if (!str || typeof str !== "string") return "";

    let value = str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // accents
        .replace(/[^a-z0-9\s-]/g, " ")   // caractères spéciaux
        .replace(/[-_]+/g, " ")          // tirets → espace
        .trim();

    let prev;

    /* ========================= */
    /* 🔁 REMOVE ARTICLES */
    /* ========================= */
    do {
        prev = value;

        value = value
            .replace(/^(a|a|de|d|du|des|le|la|les|l)\s+/i, "")
            .trim();

    } while (value !== prev);

    /* ========================= */
    /* 🔄 NORMALIZE SPACES */
    /* ========================= */
    return value.replace(/\s+/g, " ");
};