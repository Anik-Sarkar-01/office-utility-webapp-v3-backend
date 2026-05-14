const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_LINK;

console.log("MONGO ENV:", process.env.MONGODB_LINK);

const connectDb = async () => {
    try {
        await mongoose.connect(MONGODB_URL);
        console.log(`MongoDB connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.log(`MongoDB not connected: ${error}`);
        process.exit(1); // 🔥 IMPORTANT
    }
};

module.exports = connectDb;