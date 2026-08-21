const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const app = require("./Src/app");
const connectDB = require("./Src/config/db");
const cacheUtil = require("./Src/utils/cache.util");
const { runRbacMigration } = require("./Src/utils/migration.util");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect Database
        await connectDB();

        // Run Idempotent RBAC & Organization Migration
        await runRbacMigration();

        // Connect Redis Cache Utility
        await cacheUtil.connect();

        // Start Server
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server started on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server");
        console.error(error);
    }
};

startServer();