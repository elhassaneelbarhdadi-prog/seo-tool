import db from "../config/database.js";

/* ========================= */
/* 📊 TRACK USAGE */
/* ========================= */
export const trackUsage = async ({
    userId,
    type = "seo_analyze"
}) => {

    if (!userId) {
        throw new Error("userId is required");
    }

    try {
        await db.run(
            `INSERT INTO ai_usage (user_id, type, created_at)
             VALUES (?, ?, datetime('now'))`,
            [userId, type]
        );

        return true;

    } catch (err) {
        console.error("TRACK USAGE ERROR:", err);
        return false;
    }
};