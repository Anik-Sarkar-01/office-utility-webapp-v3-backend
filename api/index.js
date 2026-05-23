// force redeploy

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


// =======================
// ✅ CORS CONFIG (FIXED)
// =======================
const corsOptions = {
  origin: [
    "https://office-utility-webapp-v3-frontend.vercel.app",
    "https://teamduronto.vercel.app",
    "https://durontopona.netlify.app",
    "https://demstv.vercel.app",
    "http://localhost:3000",
    "https://dmstv.netlify.app",
    "https://durontotv.netlify.app"
  ],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};


// 🔥 MUST be first
app.use(cors(corsOptions));

// 🔥 IMPORTANT: handle preflight explicitly
app.options("*", cors(corsOptions));


// =======================
// Middleware
// =======================
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));


// =======================
// DB CONNECTION (SAFE)
// =======================
let isConnected = false;

const connectDB = async () => {
  if (!isConnected) {
    try {
      await connectDb();
      isConnected = true;
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      throw error;
    }
  }
};


// =======================
// Ensure DB connection per request (safe for serverless)
// =======================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});


// =======================
// Routes
// =======================
app.use("/api/superuser", superUserRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);


// =======================
// 404 Handler
// =======================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});


// =======================
// Export for Vercel
// =======================
module.exports = app;