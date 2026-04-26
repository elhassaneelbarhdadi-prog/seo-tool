export const generateFakeDomainData = (domain) => {
    return {
        domain: domain,
        domainAuthority: Math.floor(Math.random() * 100),
        backlinks: Math.floor(Math.random() * 100000),
        organicTraffic: Math.floor(Math.random() * 500000),
        organicKeywords: Math.floor(Math.random() * 10000),
        spamScore: Math.floor(Math.random() * 20)
    };
};