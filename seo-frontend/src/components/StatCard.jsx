

export default function StatCard({ title, value }) {

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
                {value}
            </h2>
        </motion.div>
    );
}