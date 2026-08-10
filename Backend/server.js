const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const app = require("./Src/app");
const connectDB = require("./Src/config/db");
const cacheUtil = require("./Src/utils/cache.util");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect Database
        await connectDB();

        // Connect Redis Cache Utility
        await cacheUtil.connect();

        // Start Server
        app.listen(PORT, () => {
            console.log(`
========================================
🚀 Vytalis Intelligence API Started
🌐 Server : http://localhost:${PORT}
🌍 Environment : ${process.env.NODE_ENV}
========================================
`);
        });
    } catch (error) {
        console.error("Failed to start server");
        console.error(error);
    }
};

startServer();