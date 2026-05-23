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
import profileRoutes from './routes/profile.js';

// -------------------- CONFIG --------------------
const app = express();
app.locals.dbOk = false;
app.locals.dbError = null;

// -------------------- SECURITY --------------------
app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
  validate: { xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  validate: { xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
});

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many feedback submissions, please try again later.' },
  validate: { xForwardedForHeader: false },
  skip: (req) => req.method === 'OPTIONS',
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
// Render (and many load balancers) default health checks hit `/`.
// Keep it lightweight and always return 200 if the process is up.
app.get("/", (req, res) => res.status(200).send("ok"));
app.get("/health", (req, res) =>
  res.json({
    ok: true,
    dbOk: !!app.locals.dbOk,
    dbError: app.locals.dbOk ? null : app.locals.dbError,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/profile", profileRoutes);

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
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 RecruiterRisk API running on port ${PORT}`)
    );

    let lastDbOk = null;
    const checkDb = async () => {
      if (!process.env.DATABASE_URL) {
        app.locals.dbOk = false;
        app.locals.dbError = { message: 'Missing DATABASE_URL' };
        if (lastDbOk !== false) {
          lastDbOk = false;
          console.error('❌ Missing DATABASE_URL (set it in Render environment variables)');
        }
        setTimeout(checkDb, 30_000);
        return;
      }

      let ok = false;
      try {
        await sql`select 1 as ok`;
        ok = true;
        app.locals.dbError = null;
      } catch (err) {
        ok = false;
        const code = err?.code || err?.name;
        const message = String(err?.message || 'Unknown DB error');
        app.locals.dbError = { code, message };
      }

      app.locals.dbOk = ok;
      if (ok !== lastDbOk) {
        lastDbOk = ok;
        if (ok) console.log('✅ Postgres Connected (Supabase)');
        else console.error('❌ Postgres Not Connected (will retry)', app.locals.dbError);
      }

      setTimeout(checkDb, ok ? 60_000 : 5_000);
    };

    void checkDb();
  } catch (err) {
    console.error("❌ Database Connection Error:", err?.message || err);
    process.exit(1);
  }
};

start();
