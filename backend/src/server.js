require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

import cors from "cors";

const allowedOrigins = [
  "https://recruiter-risk.vercel.app",
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN // optional: set in Render if you move domains
];

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server / curl (no origin) and your allowed list
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Make sure preflight is handled
app.options("*", cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true
}));


// Import routes
const authRoutes = require('./routes/auth');
const recruiterRoutes = require('./routes/recruiter');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const jobRoutes = require('./routes/job');              // NEW
const applicationRoutes = require('./routes/application'); // NEW

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/jobs', jobRoutes);              // NEW
app.use('/api/applications', applicationRoutes); // NEW

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 RecruiterRisk API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`💼 Job Posting System: ENABLED`);
});