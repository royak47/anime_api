import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createApiRoutes } from "./src/routes/apiRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4444;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = path.join(__dirname, "public");

// Get allowed origins from .env
let allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(origin => origin.trim());

// Fallback if not defined
if (!allowedOrigins || allowedOrigins.length === 0) {
  allowedOrigins = ["*"];
  console.warn("⚠️ No ALLOWED_ORIGINS set in .env. Defaulting to '*'.");
}

// ✅ Use cors middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ CORS: Origin not allowed - " + origin));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

// ✅ Handle preflight requests
app.options("*", cors());

// ✅ Static file serving
app.use(express.static(publicDir, { redirect: false }));

// ✅ JSON response helpers
const jsonResponse = (res, data, status = 200) =>
  res.status(status).json({ success: true, results: data });

const jsonError = (res, message = "Internal server error", status = 500) =>
  res.status(status).json({ success: false, message });

// ✅ Load API routes
createApiRoutes(app, jsonResponse, jsonError);

// ✅ 404 Page
app.get("*", (req, res) => {
  const filePath = path.join(publicDir, "404.html");
  if (fs.existsSync(filePath)) {
    res.status(404).sendFile(filePath);
  } else {
    res.status(404).send("404 Not Found");
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
