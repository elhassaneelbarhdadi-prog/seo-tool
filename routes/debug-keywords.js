import db from "../config/database.js";

const result = await db.get(`
SELECT
COUNT(*) as total,
SUM(CASE WHEN deleted = 1 THEN 1 ELSE 0 END) as deleted
FROM keywords
WHERE user_id = 2
`);

console.log(result);

process.exit();