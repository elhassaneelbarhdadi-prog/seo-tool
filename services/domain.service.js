export const generateFakeDomainData = (domain = "") => {

    /* ========================= */
    /* 🔢 SEED (STABLE RESULT) */
    /* ========================= */
    const hash = (str) =>
        str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const seed = hash(domain || "default");

    const rand = (min, max) =>
        Math.floor((seed % (max - min)) + min);

    /* ========================= */
    /* 🧠 DOMAIN AUTHORITY */
    /* ========================= */
    const domainAuthority = rand(20, 90);

    /* ========================= */
    /* 🔗 BACKLINKS (corrélé au DA) */
    /* ========================= */
    const backlinks = Math.round(domainAuthority * rand(50, 500));

    /* ========================= */
    /* 📈 TRAFFIC (corrélé DA + backlinks) */
    /* ========================= */
    const organicTraffic = Math.round(
        backlinks * (0.3 + (domainAuthority / 100))
    );

    /* ========================= */
    /* 🔍 KEYWORDS (corrélé trafic) */
    /* ========================= */
    const organicKeywords = Math.round(
        organicTraffic * 0.02
    );

    /* ========================= */
    /* 🚨 SPAM SCORE (inverse DA) */
    /* ========================= */
    const spamScore = Math.max(
        1,
        Math.round(100 - domainAuthority + rand(0, 10))
    );

    return {
        domain,
        domainAuthority,
        backlinks,
        organicTraffic,
        organicKeywords,
        spamScore
    };
};