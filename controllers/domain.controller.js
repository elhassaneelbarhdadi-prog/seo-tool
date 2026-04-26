import { generateFakeDomainData } from "../services/domain.service.js";

export const getDomainData = (req, res) => {
    const { domain } = req.body;

    if (!domain) {
        return res.status(400).json({ error: "Domain manquant" });
    }

    const data = generateFakeDomainData(domain);

    res.json(data);
};