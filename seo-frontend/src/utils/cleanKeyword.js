export const cleanKeyword = (str = "") => {
    let value = str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    let prev;

    do {
        prev = value;

        value = value
            .replace(/^(a|à|de|d'|du|des|le|la|les|l')\s+/i, "")
            .trim();

    } while (value !== prev);

    return value.replace(/\s+/g, " ");
};