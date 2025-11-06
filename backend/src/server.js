// -------------------- IMPORTS --------------------
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const authRoutes = require("./routes/auth.js");
const recruiterRoutes = require("./routes/recruiter.js");
const feedbackRoutes = require("./routes/feedback.js");
const adminRoutes = require("./routes/admin.js");
// const jobRoutes = require("./routes/job.js");  // if added

// -------------------- CONFIG --------------------
dotenv.config();
const app = express();

// -------------------- CORS SETUP --------------------
const allowedOrigins = [
  "https://recruiter-risk.vercel.app",
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN
].filter(Boolean); // Filter out undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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

// -------------------- 404 HANDLER --------------------
app.use((req, res, next) => {
  console.log(`404 -> ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Not found" });
});

// -------------------- DATABASE CONNECTION --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 RecruiterRisk API running on port ${PORT}`)
);

