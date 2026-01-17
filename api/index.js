// api/index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const superUserRoutes = require("../routes/super-user-routes");
const userRoutes = require("../routes/user-routes");
const leaveRoutes = require("../routes/leaveRoutes");
const connectDb = require("../database/db");

dotenv.config();

const app = express();

// CORS
const corsOptions = {
  origin: [
    "https://demstv.vercel.app",
    "http://localhost:3000",
    "https://dmstv.netlify.app",
  ],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(bodyParser.json({ extended: false }));
app.use("/uploads", express.static("uploads"));

// ✅ Lazy DB connection (important for serverless)
let isConnected = false;
const connectDB = async () => {
  if (!isConnected) {
    await connectDb();
    isConnected = true;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use("/api/superuser", superUserRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app; // ✅ export app for Vercel
