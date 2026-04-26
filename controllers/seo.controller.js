// controllers/seo.controller.js

import * as seoService from "../services/seo.service.js";

export async function analyze(req, res) {
    const result = await seoService.analyze(req.body, req.user);
    res.json(result);
}