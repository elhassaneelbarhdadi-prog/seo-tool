export const formatNumber = (num) => {

    const n = Number(num);

    if (!n || n === 0) return "0";

    if (n >= 1_000_000) {
        return (n / 1_000_000).toFixed(1) + "M";
    }

    if (n >= 1_000) {
        return (n / 1_000).toFixed(1) + "K";
    }

    return n.toString();
};