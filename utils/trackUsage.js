import db from "../config/database.js";

export const trackUsage = async (userId, message = "seo_analyze") => {
    await db.run(
        "INSERT INTO ai_usage (user_id, message) VALUES (?, ?)",
        [userId, message]
    );
};