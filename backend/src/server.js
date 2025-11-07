// -------------------- IMPORTS --------------------
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import recruiterRoutes from './routes/recruiter.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
// import jobRoutes from './routes/job.js';  // if added

// -------------------- CONFIG --------------------
dotenv.config();
const app = express();

// -------------------- CORS SETUP --------------------
const allowedOrigins = [
  "http://localhost:5173",
  /^https:\/\/recruiter-risk.*\.vercel\.app$/,
  process.env.FRONTEND_ORIGIN
].filter(Boolean); // Filter out undefined values

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// -------------------- MIDDLEWARE --------------------
app.use(express.json());

// -------------------- ROUTES --------------------
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/jobs", jobRoutes);  // optional

// -------------------- ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  res.status(500).json({ 
    success: false, 
    error: 'Server error',
    details: err.message 
  });
});

// -------------------- 404 HANDLER --------------------
app.use((req, res, next) => {
  console.log(`404 -> ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Not found" });
});

// -------------------- DATABASE CONNECTION --------------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 RecruiterRisk API running on port ${PORT}`)
);

