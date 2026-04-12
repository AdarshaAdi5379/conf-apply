// -------------------- IMPORTS --------------------
import './env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import sql from './db.js';

import authRoutes from './routes/auth.js';
import recruiterRoutes from './routes/recruiter.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import jobRoutes from './routes/job.js';
import applicationRoutes from './routes/application.js';

// -------------------- CONFIG --------------------
const app = express();

// -------------------- SECURITY --------------------
app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many feedback submissions, please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/feedback', feedbackLimiter);

// -------------------- CORS SETUP --------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
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
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);

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

// -------------------- STARTUP --------------------
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing DATABASE_URL. Set it in backend/.env');
    }

    await sql`select 1 as ok`;
    console.log('✅ Postgres Connected (Supabase)');

    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 RecruiterRisk API running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Database Connection Error:", err?.message || err);
    process.exit(1);
  }
};

start();
