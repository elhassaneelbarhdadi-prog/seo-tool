import express from "express";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import crypto from "crypto";

import db from "../config/database.js";

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const seoPageLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
});

/* =========================================================
   HELPERS
========================================================= */

function hash(value = "") {
    return crypto
        .createHash("sha256")
        .update(String(value))
        .digest("hex")
        .slice(0, 12);
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTrend() {
    return ["stable", "hausse", "baisse"][random(0, 2)];
}

function normalizeText(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeForCheck(value = "") {
    return normalizeText(value)
        .replace(/[’']/g, "'")
        .replace(/[.,;:!?()[\]{}"«»]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function slugify(value = "") {
    return normalizeText(value)
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function capitalize(value = "") {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

/* =========================================================
   AFFICHAGE FRANÇAIS
========================================================= */

function beautifyKeyword(keyword = "") {
    let value = String(keyword).trim();

    const replacements = [
        [/\bmedecine\b/gi, "médecine"],
        [/\bmedecines\b/gi, "médecines"],
        [/\benergetique\b/gi, "énergétique"],
        [/\benergetiques\b/gi, "énergétiques"],
        [/\besthetique\b/gi, "esthétique"],
        [/\besthetiques\b/gi, "esthétiques"],
        [/\bbeaute\b/gi, "beauté"],
        [/\bregime\b/gi, "régime"],
        [/\bprevention\b/gi, "prévention"],
        [/\btherapie\b/gi, "thérapie"],
        [/\btherapies\b/gi, "thérapies"],
        [/\bdecoration\b/gi, "décoration"],
        [/\brenovation\b/gi, "rénovation"],
        [/\breparation\b/gi, "réparation"],
        [/\belectricite\b/gi, "électricité"],
        [/\bfrancais\b/gi, "français"],
        [/\bfrancaise\b/gi, "française"],
        [/\bfrancaises\b/gi, "françaises"],
        [/\bmaconnerie\b/gi, "maçonnerie"],
    ];

    for (const [pattern, replacement] of replacements) {
        value = value.replace(pattern, replacement);
    }

    return value;
}

function displayCity(city = "") {
    return capitalize(String(city).trim());
}

/* =========================================================
   PARSING DU SLUG
========================================================= */

async function parseSlug(slug = "") {
    const cleanSlug = slugify(slug);

    const rows = await db.all(`
    SELECT city
    FROM business_profiles
    WHERE city IS NOT NULL
      AND TRIM(city) != ''
    ORDER BY LENGTH(city) DESC
  `);

    const cities = [
        ...new Set(
            (rows || [])
                .map((row) => String(row.city || "").trim())
                .filter(Boolean)
        ),
    ];

    for (const city of cities) {
        const citySlug = slugify(city);

        if (
            citySlug &&
            cleanSlug.endsWith(`-${citySlug}`) &&
            cleanSlug.length > citySlug.length + 1
        ) {
            const keywordSlug = cleanSlug.slice(
                0,
                -(citySlug.length + 1)
            );

            return {
                keyword: keywordSlug.replace(/-/g, " ").trim(),
                city,
            };
        }
    }

    const parts = cleanSlug.split("-");

    if (parts.length >= 2) {
        const citySlug = parts.pop();

        return {
            keyword: parts.join(" ").trim(),
            city: citySlug.replace(/-/g, " ").trim(),
        };
    }

    return {
        keyword: cleanSlug.replace(/-/g, " ").trim(),
        city: "",
    };
}

/* =========================================================
   CONTEXTE ANNUAIRE
========================================================= */

async function getDirectoryContext(keyword, city) {
    if (!city) return [];

    const rows = await db.all(
        `
      SELECT
        id,
        name,
        description,
        keyword,
        city,
        score,
        is_featured
      FROM business_profiles
      WHERE LOWER(TRIM(city)) = LOWER(TRIM(?))
      ORDER BY is_featured DESC, score DESC, id DESC
      LIMIT 20
    `,
        [city]
    );

    const normalizedKeyword = normalizeText(keyword);

    return (rows || []).filter((row) => {
        const rowKeyword = normalizeText(row.keyword || "");
        const rowDescription = normalizeText(row.description || "");

        return (
            !normalizedKeyword ||
            rowKeyword.includes(normalizedKeyword) ||
            normalizedKeyword.includes(rowKeyword) ||
            rowDescription.includes(normalizedKeyword)
        );
    });
}

/* =========================================================
   NETTOYAGE DU CONTENU IA
========================================================= */

function cleanGeneratedContent(content, keyword, city) {
    if (!content) return "";

    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    let cleaned = String(content)
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const replacements = [
        [/médecin chinois/gi, keywordDisplay],
        [/medecin chinois/gi, keywordDisplay],

        [
            /professionnels de santé spécialisés/gi,
            "professionnels et structures correspondant à cette recherche",
        ],

        [
            /professionnels de santé/gi,
            "professionnels et structures",
        ],

        [
            /praticiens qualifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /praticien qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /professionnels qualifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /professionnel qualifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /professionnels certifiés/gi,
            "professionnels correspondant à cette recherche",
        ],

        [
            /professionnel certifié/gi,
            "professionnel correspondant à cette recherche",
        ],

        [
            /certifications nécessaires/gi,
            "informations disponibles sur le profil",
        ],

        [
            /certification nécessaire/gi,
            "informations disponibles sur le profil",
        ],

        [
            /diplômes nécessaires/gi,
            "informations disponibles sur le profil",
        ],

        [
            /diplôme nécessaire/gi,
            "informations disponibles sur le profil",
        ],

        [
            /maintenir l'équilibre et l'harmonie/gi,
            "présenter différentes pratiques ou services associés",
        ],

        [
            /maintien de l'équilibre et de l'harmonie/gi,
            "présentation de différentes pratiques ou services associés",
        ],

        [
            /équilibre et l'harmonie au sein du corps/gi,
            "description générale de différentes pratiques associées",
        ],

        [
            /équilibre et harmonie/gi,
            "description générale de différentes pratiques associées",
        ],

        [
            /circulation du qi\s*\(énergie vitale\)/gi,
            "des concepts traditionnels propres à certaines pratiques",
        ],

        [
            /circulation du qi/gi,
            "des concepts traditionnels propres à certaines pratiques",
        ],

        [
            /qi\s*\(énergie vitale\)/gi,
            "des concepts traditionnels",
        ],

        [
            /énergie vitale/gi,
            "des concepts traditionnels",
        ],

        [
            /favoriser le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /promouvoir le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /promouvoir un meilleur bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /améliorer le bien-être/gi,
            "présenter ce domaine",
        ],

        [
            /améliore le bien-être/gi,
            "présente ce domaine",
        ],

        [
            /garantit/gi,
            "présente",
        ],

        [
            /garantie/gi,
            "présentation",
        ],

        [
            /guérir/gi,
            "prendre en charge",
        ],

        [
            /guérison/gi,
            "prise en charge",
        ],

        [
            /traiter une maladie/gi,
            "présenter une activité ou un service",
        ],

        [
            /traiter les maladies/gi,
            "présenter une activité ou un service",
        ],

        [
            /prévenir les maladies/gi,
            "présenter une activité ou un service",
        ],

        [
            /soins médicaux/gi,
            "services présentés",
        ],

        [
            /soigner/gi,
            "proposer",
        ],

        [
            /soigne/gi,
            "propose",
        ],

        [
            /efficacité démontrée/gi,
            "description disponible",
        ],

        [
            /efficace pour/gi,
            "associé à",
        ],

        [
            /vous accéderez à une liste de professionnels/gi,
            "vous pourrez consulter les informations disponibles dans l'annuaire",
        ],

        [
            /vous pourrez trouver des professionnels/gi,
            "vous pourrez consulter les profils disponibles",
        ],

        [
            /vous pourrez trouver un professionnel/gi,
            "vous pourrez consulter les profils disponibles",
        ],

        [
            /trouver des professionnels/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver un professionnel/gi,
            "consulter les profils disponibles",
        ],

        [
            /trouver celui qui correspond[^.]*\./gi,
            "comparer les informations disponibles.",
        ],

        [
            /les services proposés, les coordonnées et les adresses/gi,
            "les informations affichées dans les profils",
        ],

        [
            /les coordonnées et les adresses des praticiens/gi,
            "les informations affichées sur les profils",
        ],

        [
            /avis et les retours/gi,
            "informations publiées",
        ],

        [
            /avis des clients/gi,
            "informations publiées",
        ],

        [
            /avis clients/gi,
            "informations publiées",
        ],

        [
            /retours des clients/gi,
            "informations publiées",
        ],

        [
            /facilitant ainsi l'accès aux services/gi,
            "permettant de cibler une recherche locale",
        ],

        [
            /facilitant ainsi l'accès/gi,
            "permettant de cibler une recherche locale",
        ],

        [
            /facilitant l'accès aux services/gi,
            "permettant de cibler une recherche selon la localisation",
        ],

        [
            /faciliter l'accès aux services/gi,
            "cibler une recherche selon la localisation",
        ],

        [
            /connaissent bien les besoins de la communauté locale/gi,
            "sont présentés selon les informations disponibles",
        ],

        [
            /pratique ancestrale/gi,
            "domaine présent dans différentes sources et annuaires",
        ],

        [
            /dans la région/gi,
            `à ${cityDisplay}`,
        ],
    ];

    for (const [pattern, replacement] of replacements) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    /* Titres uniformisés */

    cleaned = cleaned.replace(
        /^##\s*Rechercher .*$/gim,
        `## Rechercher ${keywordDisplay} à ${cityDisplay}`
    );

    cleaned = cleaned.replace(
        /^##\s*Quels services .*$/gim,
        `## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^##\s*Comment choisir .*$/gim,
        `## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^###\s*Où rechercher .*$/gim,
        `### Où rechercher ${keywordDisplay} à ${cityDisplay} ?`
    );

    cleaned = cleaned.replace(
        /^###\s*Comment choisir .*$/gim,
        `### Comment choisir un professionnel adapté à ${keywordDisplay} ?`
    );

    return cleaned.trim();
}

/* =========================================================
   VALIDATION STRICTE
========================================================= */

function validateGeneratedContent(content, keyword, city) {
    const text = normalizeForCheck(content);

    const reasons = [];

    if (!text || text.length < 500) {
        reasons.push("contenu trop court");
    }

    const forbidden = [
        [
            /equilibre et harmonie/,
            "formulation autour de l'équilibre et de l'harmonie",
        ],

        [
            /maintenir l'equilibre/,
            "promesse autour du maintien de l'équilibre",
        ],

        [
            /energie vitale/,
            "référence à l'énergie vitale",
        ],

        [
            /\bqi\b/,
            "référence au Qi",
        ],

        [
            /favoriser le bien etre/,
            "promesse autour du bien-être",
        ],

        [
            /promouvoir le bien etre/,
            "promesse autour du bien-être",
        ],

        [
            /ameliore le bien etre/,
            "promesse autour du bien-être",
        ],

        [
            /garantit/,
            "garantie",
        ],

        [
            /garantie/,
            "garantie",
        ],

        [
            /guerir/,
            "promesse de guérison",
        ],

        [
            /guerison/,
            "référence à la guérison",
        ],

        [
            /traiter une maladie/,
            "affirmation médicale",
        ],

        [
            /traiter les maladies/,
            "affirmation médicale",
        ],

        [
            /prevenir les maladies/,
            "affirmation médicale",
        ],

        [
            /soigner/,
            "affirmation médicale",
        ],

        [
            /soins medicaux/,
            "affirmation médicale",
        ],

        [
            /efficacite demontree/,
            "preuve d'efficacité non sourcée",
        ],

        [
            /efficace pour/,
            "promesse d'efficacité",
        ],

        [
            /professionnel certifie/,
            "qualification non vérifiée",
        ],

        [
            /professionnels certifies/,
            "qualification non vérifiée",
        ],

        [
            /praticien qualifie/,
            "qualification non vérifiée",
        ],

        [
            /praticiens qualifies/,
            "qualification non vérifiée",
        ],

        [
            /professionnel qualifie/,
            "qualification non vérifiée",
        ],

        [
            /professionnels qualifies/,
            "qualification non vérifiée",
        ],

        [
            /certification necessaire/,
            "certification non vérifiée",
        ],

        [
            /certifications necessaires/,
            "certification non vérifiée",
        ],

        [
            /diplome necessaire/,
            "diplôme non vérifié",
        ],

        [
            /diplomes necessaires/,
            "diplôme non vérifié",
        ],

        [
            /vous accederez a une liste/,
            "promesse de liste",
        ],

        [
            /vous pourrez trouver/,
            "promesse de résultat",
        ],

        [
            /trouver un professionnel/,
            "promesse de résultat",
        ],

        [
            /trouver des professionnels/,
            "promesse de résultat",
        ],

        [
            /trouver celui qui correspond/,
            "promesse de résultat",
        ],

        [
            /avis et les retours/,
            "avis non présents",
        ],

        [
            /avis des clients/,
            "avis non présents",
        ],

        [
            /avis clients/,
            "avis non présents",
        ],

        [
            /retours des clients/,
            "avis non présents",
        ],

        [
            /facilitant ainsi l acces/,
            "promesse implicite d'accès",
        ],

        [
            /connaissent bien les besoins de la communaute locale/,
            "affirmation non vérifiée",
        ],

        [
            /les meilleurs/,
            "affirmation de popularité",
        ],

        [
            /meilleur professionnel/,
            "affirmation de popularité",
        ],

        [
            /tous les professionnels/,
            "affirmation exhaustive",
        ],

        [
            /l'ensemble des professionnels/,
            "affirmation exhaustive",
        ],

        [
            /liste de professionnels et d'entreprises/,
            "affirmation exhaustive",
        ],
    ];

    for (const [pattern, reason] of forbidden) {
        if (pattern.test(text)) {
            reasons.push(reason);
        }
    }

    const expectedKeyword = normalizeForCheck(keyword);
    const expectedCity = normalizeForCheck(city);

    if (
        expectedKeyword &&
        !text.includes(expectedKeyword)
    ) {
        reasons.push(
            "mot-clé principal insuffisamment présent"
        );
    }

    if (
        expectedCity &&
        !text.includes(expectedCity)
    ) {
        reasons.push(
            "ville insuffisamment présente"
        );
    }

    return {
        valid: reasons.length === 0,
        reasons,
    };
}

/* =========================================================
   FALLBACK SECURISE
========================================================= */

function buildFallbackContent(
    keyword,
    city,
    profiles = []
) {
    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    const hasProfiles = profiles.length > 0;

    return `
La recherche « ${keywordDisplay} à ${cityDisplay} » permet de cibler un domaine ou une activité dans une zone géographique précise. Cette page présente les informations disponibles dans notre annuaire SEO et peut servir de point de départ pour une recherche locale.

## Rechercher ${keywordDisplay} à ${cityDisplay}

Une recherche locale permet de cibler ${keywordDisplay} en fonction d'une ville précise. Pour ${cityDisplay}, il est possible de consulter les informations publiées sur les profils disponibles dans l'annuaire ainsi que d'utiliser la même formulation dans un moteur de recherche.

## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?

Les activités associées à ${keywordDisplay} peuvent varier selon les entreprises ou structures référencées. Il est donc préférable de vérifier les informations réellement publiées sur chaque fiche avant de prendre contact.

${hasProfiles
            ? "Des profils correspondant à cette recherche sont actuellement présents dans notre annuaire. Les informations affichées sur ces fiches peuvent être consultées et comparées."
            : "Aucun profil spécifique correspondant à cette recherche n'est actuellement présent dans les données disponibles sur cette page."
        }

## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?

Pour comparer les profils disponibles, il est utile de vérifier l'activité déclarée, la localisation et les autres renseignements réellement publiés dans chaque fiche. Les informations peuvent varier d'un profil à l'autre.

## Rechercher un professionnel dans notre annuaire SEO

Notre annuaire SEO permet de consulter des profils classés selon leur activité et leur localisation. Les résultats présentés dépendent des données réellement enregistrées dans l'annuaire.

## Questions fréquentes

### Où rechercher ${keywordDisplay} à ${cityDisplay} ?

La recherche peut être effectuée dans notre annuaire SEO et dans les moteurs de recherche en utilisant le terme « ${keywordDisplay} à ${cityDisplay} ».

### Comment choisir un professionnel adapté à ${keywordDisplay} ?

Il est conseillé de comparer les informations disponibles sur les différents profils et de vérifier les renseignements publiés avant de prendre contact.

### Quels peuvent être les avantages d'une recherche locale ?

Une recherche locale permet de cibler les résultats selon une ville précise et de comparer les informations disponibles pour les profils publiés.

## Conclusion

La recherche « ${keywordDisplay} à ${cityDisplay} » permet d'orienter les recherches vers une zone géographique précise. Notre annuaire présente les profils réellement disponibles et les informations qui leur sont associées.
`.trim();
}

/* =========================================================
   PROMPT IA
========================================================= */

function buildGenerationPrompt({
    keyword,
    city,
    profiles,
}) {
    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    const directoryContext =
        profiles.length > 0
            ? `
DONNÉES RÉELLES DISPONIBLES :

${JSON.stringify(
                profiles.slice(0, 10).map((profile) => ({
                    name: profile.name || "",
                    description: profile.description || "",
                    keyword: profile.keyword || "",
                    city: profile.city || "",
                })),
                null,
                2
            )}

Utilise uniquement ces données pour parler de profils précis.
N'invente aucune adresse, téléphone, horaire, certification,
diplôme, avis ou prestation.
`
            : `
AUCUN PROFIL SPÉCIFIQUE N'EST FOURNI.

Reste général et ne parle pas d'entreprise ou de professionnel précis.
`;

    return `
Tu rédiges une page SEO locale française sur « ${keywordDisplay} à ${cityDisplay} ».

RÈGLES ABSOLUES :

- Conserve exactement le sens du mot-clé.
- « médecine chinoise » ne doit jamais devenir « médecin chinois ».
- Ne transforme pas une activité ou un domaine en profession.
- N'invente aucune donnée.
- Aucun avis client.
- Aucun chiffre de recherche dans le texte.
- Aucun CPC dans le texte.
- Aucun revenu dans le texte.
- Aucun trafic estimé dans le texte.
- Aucune qualification, certification ou diplôme non fourni.
- Aucune promesse médicale.
- Ne dis pas guérir.
- Ne dis pas soigner.
- Ne dis pas traiter une maladie.
- Ne dis pas prévenir une maladie.
- N'utilise pas « efficace pour ».
- N'utilise pas « garantit ».
- Ne parle pas de Qi.
- Ne parle pas d'énergie vitale.
- Ne parle pas d'équilibre du corps.
- Ne parle pas d'harmonie du corps.
- Ne dis pas « vous pourrez trouver un professionnel ».
- Ne dis pas « vous pourrez trouver des professionnels ».
- Ne dis pas « trouver un professionnel » comme résultat garanti.
- Ne dis pas « trouver des professionnels » comme résultat garanti.
- Ne parle pas des « meilleurs ».
- Ne parle pas d'avis ou de retours clients.
- Ne dis pas « facilitant l'accès aux services ».
- N'affirme pas qu'un professionnel connaît les besoins de la communauté locale.
- Ne prétends pas fournir une liste exhaustive.

STRUCTURE :

Introduction

## Rechercher ${keywordDisplay} à ${cityDisplay}

## Quels services liés à ${keywordDisplay} peut-on trouver à ${cityDisplay} ?

## Comment choisir un professionnel adapté à ${keywordDisplay} à ${cityDisplay} ?

## Rechercher un professionnel dans notre annuaire SEO

## Questions fréquentes

### Où rechercher ${keywordDisplay} à ${cityDisplay} ?

### Comment choisir un professionnel adapté à ${keywordDisplay} ?

### Quels peuvent être les avantages d'une recherche locale ?

## Conclusion

Style naturel, informatif et professionnel.
Évite le bourrage de mots-clés.
Ne fais aucune promesse.
Ne crée aucune information.

${directoryContext}

Retourne uniquement le contenu final de la page.
`;
}

/* =========================================================
   REPARATION IA
========================================================= */

async function repairContent(
    content,
    keyword,
    city,
    reasons
) {
    if (!process.env.OPENAI_API_KEY) {
        return "";
    }

    const keywordDisplay = beautifyKeyword(keyword);
    const cityDisplay = displayCity(city);

    const response =
        await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content:
                        "Tu corriges un contenu SEO français. Tu supprimes toute affirmation non vérifiée et toute promesse. Tu n'inventes rien.",
                },
                {
                    role: "user",
                    content: `
Corrige cette page SEO sur « ${keywordDisplay} à ${cityDisplay} ».

PROBLÈMES DÉTECTÉS :
${reasons.map((r) => `- ${r}`).join("\n")}

CONTENU :

${content}

CONSIGNES :

- Conserve le sens exact du mot-clé.
- Ne transforme jamais « médecine chinoise » en « médecin chinois ».
- Supprime les avis et retours clients.
- Supprime les promesses de résultat.
- Supprime toute affirmation médicale.
- Supprime les qualifications non vérifiées.
- Supprime les références au Qi et à l'énergie vitale.
- Supprime les formulations sur l'équilibre et l'harmonie du corps.
- Ne promets jamais que l'utilisateur trouvera un professionnel.
- N'invente aucune donnée.

Retourne uniquement le contenu corrigé.
`,
                },
            ],
        });

    return (
        response?.choices?.[0]?.message?.content?.trim() ||
        ""
    );
}

/* =========================================================
   GENERATION DU CONTENU
========================================================= */

async function generateContent(slug) {
    const { keyword, city } = await parseSlug(slug);

    const profiles = await getDirectoryContext(
        keyword,
        city
    );

    let content = "";

    if (process.env.OPENAI_API_KEY) {
        try {
            const response =
                await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    temperature: 0.1,
                    messages: [
                        {
                            role: "system",
                            content:
                                "Tu es un rédacteur SEO français rigoureux. Tu respectes strictement les contraintes et n'inventes rien.",
                        },
                        {
                            role: "user",
                            content: buildGenerationPrompt({
                                keyword,
                                city,
                                profiles,
                            }),
                        },
                    ],
                });

            content =
                response?.choices?.[0]?.message?.content?.trim() ||
                "";
        } catch (error) {
            console.error(
                "OPENAI SEO GENERATION ERROR:",
                error.message
            );
        }
    }

    if (!content) {
        content = buildFallbackContent(
            keyword,
            city,
            profiles
        );
    }

    content = cleanGeneratedContent(
        content,
        keyword,
        city
    );

    let validation =
        validateGeneratedContent(
            content,
            keyword,
            city
        );

    /* Deux tentatives de réparation */

    for (
        let attempt = 1;
        attempt <= 2 && !validation.valid;
        attempt += 1
    ) {
        try {
            const repaired =
                await repairContent(
                    content,
                    keyword,
                    city,
                    validation.reasons
                );

            if (!repaired) {
                break;
            }

            content = cleanGeneratedContent(
                repaired,
                keyword,
                city
            );

            validation =
                validateGeneratedContent(
                    content,
                    keyword,
                    city
                );
        } catch (error) {
            console.error(
                `SEO CONTENT REPAIR ERROR ${attempt}:`,
                error.message
            );
        }
    }

    /* Fallback si le texte reste mauvais */

    if (!validation.valid) {
        console.warn(
            "SEO CONTENT FALLBACK USED:",
            validation.reasons
        );

        content = buildFallbackContent(
            keyword,
            city,
            profiles
        );
    }

    /* Dernier contrôle */

    const finalValidation =
        validateGeneratedContent(
            content,
            keyword,
            city
        );

    if (!finalValidation.valid) {
        console.warn(
            "SEO FINAL FALLBACK USED:",
            finalValidation.reasons
        );

        content = buildFallbackContent(
            keyword,
            city,
            profiles
        );
    }

    return {
        keyword,
        city,
        profiles,
        content,
    };
}

/* =========================================================
   SAUVEGARDE / REGENERATION
========================================================= */

async function saveGeneratedPage(slug) {
    const generated =
        await generateContent(slug);

    const keywordDisplay =
        beautifyKeyword(
            generated.keyword
        );

    const cityDisplay =
        displayCity(
            generated.city
        );

    const title =
        `${keywordDisplay} à ${cityDisplay} | Annuaire SEO`;

    const score = random(70, 95);
    const volume = random(20, 800);
    const difficulty = random(10, 70);
    const cpc = Number(
        (Math.random() * 4 + 0.2).toFixed(2)
    );
    const revenue = random(50, 1000);
    const trend = generateTrend();

    await db.run(
        `
      UPDATE seo_pages
      SET
        keyword = ?,
        city = ?,
        title = ?,
        content = ?,
        score = ?,
        volume = ?,
        difficulty = ?,
        cpc = ?,
        revenue = ?,
        trend = ?
      WHERE slug = ?
    `,
        [
            generated.keyword,
            generated.city,
            title,
            generated.content,
            score,
            volume,
            difficulty,
            cpc,
            revenue,
            trend,
            slug,
        ]
    );

    return db.get(
        `
      SELECT *
      FROM seo_pages
      WHERE slug = ?
      LIMIT 1
    `,
        [slug]
    );
}

/* =========================================================
   DIRECTORY PAGES
========================================================= */

router.get(
    "/directory-pages",
    seoPageLimiter,
    async (req, res) => {
        try {
            const requestedLimit =
                Number(req.query.limit || 30);

            const limit = Math.min(
                Math.max(
                    Number.isFinite(
                        requestedLimit
                    )
                        ? requestedLimit
                        : 30,
                    1
                ),
                100
            );

            const cityRows =
                await db.all(`
          SELECT DISTINCT city
          FROM business_profiles
          WHERE city IS NOT NULL
            AND TRIM(city) != ''
        `);

            const validCities =
                new Set(
                    (cityRows || [])
                        .map((row) =>
                            slugify(
                                row.city || ""
                            )
                        )
                        .filter(Boolean)
                );

            if (!validCities.size) {
                return res.json({
                    success: true,
                    pages: [],
                    count: 0,
                });
            }

            const rows =
                await db.all(`
          SELECT
            id,
            keyword,
            city,
            slug,
            title,
            content,
            score,
            volume,
            difficulty,
            cpc,
            revenue,
            trend,
            created_at
          FROM seo_pages
          WHERE slug IS NOT NULL
            AND TRIM(slug) != ''
          ORDER BY created_at DESC
          LIMIT ${Math.min(
                    limit * 3,
                    300
                )}
        `);

            const seen =
                new Set();

            const pages = [];

            for (const row of rows || []) {
                const rowSlug =
                    slugify(
                        row.slug || ""
                    );

                const rowCitySlug =
                    slugify(
                        row.city || ""
                    );

                if (
                    !rowSlug ||
                    !rowCitySlug ||
                    !validCities.has(
                        rowCitySlug
                    )
                ) {
                    continue;
                }

                if (
                    !rowSlug.endsWith(
                        `-${rowCitySlug}`
                    )
                ) {
                    continue;
                }

                if (
                    seen.has(rowSlug)
                ) {
                    continue;
                }

                seen.add(rowSlug);

                pages.push({
                    id: row.id,
                    keyword:
                        beautifyKeyword(
                            row.keyword || ""
                        ),
                    city:
                        displayCity(
                            row.city || ""
                        ),
                    slug: row.slug,
                    title:
                        row.title ||
                        `${beautifyKeyword(
                            row.keyword || ""
                        )
                        } à ${displayCity(
                            row.city || ""
                        )
                        } | Annuaire SEO`,
                    content:
                        row.content || "",
                    score: row.score,
                    volume: row.volume,
                    difficulty:
                        row.difficulty,
                    competition:
                        row.difficulty,
                    cpc: row.cpc,
                    revenue: row.revenue,
                    trend: row.trend,
                    created_at:
                        row.created_at,
                });

                if (
                    pages.length >=
                    limit
                ) {
                    break;
                }
            }

            return res.json({
                success: true,
                pages,
                count:
                    pages.length,
            });
        } catch (error) {
            console.error(
                "DIRECTORY PAGES ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Erreur lors de la récupération des pages SEO.",
            });
        }
    }
);

/* =========================================================
   REGENERER UNE PAGE EXISTANTE
========================================================= */

router.get(
    "/regenerate",
    seoPageLimiter,
    async (req, res) => {
        try {
            const slug =
                slugify(
                    req.query.slug || ""
                );

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Slug manquant.",
                });
            }

            const existingPage =
                await db.get(
                    `
            SELECT *
            FROM seo_pages
            WHERE slug = ?
            LIMIT 1
          `,
                    [slug]
                );

            if (!existingPage) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Page SEO introuvable.",
                });
            }

            const updatedPage =
                await saveGeneratedPage(
                    slug
                );

            return res.json({
                success: true,
                message:
                    "Page SEO régénérée avec succès",
                page: {
                    ...updatedPage,
                    competition:
                        updatedPage?.difficulty ??
                        null,
                },
            });
        } catch (error) {
            console.error(
                "SEO REGENERATE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Erreur lors de la régénération de la page SEO.",
            });
        }
    }
);

/* =========================================================
   RECUPERER / CREER UNE PAGE SEO
========================================================= */

router.get(
    "/",
    seoPageLimiter,
    async (req, res) => {
        try {
            const slug =
                slugify(
                    req.query.slug || ""
                );

            if (!slug) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Slug manquant.",
                });
            }

            let page =
                await db.get(
                    `
            SELECT *
            FROM seo_pages
            WHERE slug = ?
            LIMIT 1
          `,
                    [slug]
                );

            /*
             * IMPORTANT :
             * si une ancienne page existe mais contient
             * un mauvais texte, on la régénère automatiquement.
             */

            if (page) {
                const validation =
                    validateGeneratedContent(
                        page.content || "",
                        page.keyword || "",
                        page.city || ""
                    );

                const missingTitle =
                    !page.title ||
                    !String(
                        page.title
                    ).trim();

                if (
                    !validation.valid ||
                    missingTitle
                ) {
                    console.log(
                        "♻️ SEO OLD PAGE INVALID -> REGEN:",
                        slug,
                        validation.reasons
                    );

                    page =
                        await saveGeneratedPage(
                            slug
                        );
                }
            } else {
                const generated =
                    await generateContent(
                        slug
                    );

                const title =
                    `${beautifyKeyword(
                        generated.keyword
                    )
                    } à ${displayCity(
                        generated.city
                    )
                    } | Annuaire SEO`;

                const score =
                    random(70, 95);

                const volume =
                    random(20, 800);

                const difficulty =
                    random(10, 70);

                const cpc =
                    Number(
                        (
                            Math.random() *
                            4 +
                            0.2
                        ).toFixed(2)
                    );

                const revenue =
                    random(50, 1000);

                const trend =
                    generateTrend();

                await db.run(
                    `
            INSERT INTO seo_pages (
              keyword,
              city,
              slug,
              title,
              content,
              score,
              volume,
              difficulty,
              cpc,
              revenue,
              trend
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
                    [
                        generated.keyword,
                        generated.city,
                        slug,
                        title,
                        generated.content,
                        score,
                        volume,
                        difficulty,
                        cpc,
                        revenue,
                        trend,
                    ]
                );

                page =
                    await db.get(
                        `
              SELECT *
              FROM seo_pages
              WHERE slug = ?
              LIMIT 1
            `,
                        [slug]
                    );
            }

            return res.json({
                success: true,
                slug: page.slug,
                keyword: page.keyword,
                city: page.city,
                title: page.title,
                content: page.content,
                score: page.score,
                volume: page.volume,
                difficulty:
                    page.difficulty,
                competition:
                    page.difficulty,
                cpc: page.cpc,
                revenue:
                    page.revenue,
                trend:
                    page.trend,
                created_at:
                    page.created_at,
            });
        } catch (error) {
            console.error(
                "SEO PAGE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Erreur lors de la récupération de la page SEO.",
            });
        }
    }
);

/* =========================================================
   EXPORT ESM
========================================================= */

export default router;