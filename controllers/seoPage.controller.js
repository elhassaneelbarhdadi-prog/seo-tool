import db from "../config/database.js";
import { cleanKeyword } from "../utils/cleanKeyword.js";
import { estimateSEO } from "../utils/seoEstimator.js";

export const getSeoPage = async (req, res) => {
    try {
        const { slug } = req.query;

        /* ========================= */
        /* ❌ VALIDATION */
        /* ========================= */
        if (!slug || typeof slug !== "string") {
            return res.status(400).json({ error: "Missing slug" });
        }

        let page = null;

        /* ========================= */
        /* 🔎 DB LOOKUP */
        /* ========================= */
        try {
            page = await db.get(
                `SELECT * FROM seo_pages WHERE slug = ?`,
                [slug]
            );
        } catch (dbError) {
            console.error("DB ERROR:", dbError);
        }

        /* ========================= */
        /* ✅ SI PAGE EXISTE */
        /* ========================= */
        if (page) {
            return res.json(page);
        }

        /* ========================= */
        /* 🔥 FALLBACK UNIQUE (SOURCE SEO) */
        /* ========================= */

        const parts = slug.split("-").filter(Boolean);

        if (parts.length < 2) {
            return res.status(400).json({ error: "Invalid slug format" });
        }

        const city = parts.pop().toLowerCase();
        const keywordRaw = parts.join(" ");
        const keyword = cleanKeyword(keywordRaw);

        /* 👉 SÉCURITÉ */
        if (!keyword || !city) {
            return res.status(400).json({ error: "Invalid keyword or city" });
        }

        /* ========================= */
        /* 📊 CALCUL SEO UNIQUE */
        /* ========================= */
        const seo = estimateSEO(keyword);

        /* ========================= */
        /* 🔤 FORMAT */
        /* ========================= */
        const capitalize = (s) =>
            s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

        const keywordLabel = capitalize(keyword);
        const cityLabel = capitalize(city);

        /* ========================= */
        /* 🧠 CONTENU SEO PROPRE */
        /* ========================= */
        const content = `
<h2>${keywordLabel} à ${cityLabel}</h2>

<p>
À ${cityLabel}, la recherche "<strong>${keyword}</strong>" génère environ 
<strong>${seo.volume} recherches mensuelles</strong>.
</p>

<p>
💰 Potentiel estimé : <strong>${seo.revenue}€ / mois</strong><br/>
⚔️ Concurrence : <strong>${seo.competition}</strong><br/>
📊 CPC moyen : <strong>${seo.cpc.toFixed(2)}€</strong>
</p>

<p>
Se positionner sur ${keyword} à ${cityLabel} permet de capter un trafic qualifié
et de générer des clients de manière durable grâce au SEO.
</p>
`;

        /* ========================= */
        /* ✅ RESPONSE UNIFIÉE */
        /* ========================= */
        return res.json({
            slug,
            keyword,
            city,
            volume: seo.volume,
            cpc: seo.cpc,
            revenue: seo.revenue,
            competition: seo.competition,
            score: seo.score,
            content
        });

    } catch (err) {
        console.error("SEO PAGE ERROR:", err);

        return res.status(500).json({
            slug: req.query.slug || "",
            error: "SEO generation failed",
            content: "Contenu SEO temporairement indisponible"
        });
    }
};