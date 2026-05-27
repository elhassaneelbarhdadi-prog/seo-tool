
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function StatCard({ title, value, suffix = "", fallback = "-" }) {

    const safeValue =
        value !== undefined && value !== null && value !== ""
            ? value
            : fallback;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-all"
        >
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {title}
            </p>

            <h2 className="text-2xl font-bold mt-2">
                {safeValue}
                {safeValue !== fallback && suffix}
            </h2>
        </motion.div>
    );
}