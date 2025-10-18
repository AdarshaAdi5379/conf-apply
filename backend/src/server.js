require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✓ Auth routes loaded');
} catch (error) {
  console.error('✗ Error loading auth routes:', error.message);
}

try {
  app.use('/api/recruiter', require('./routes/recruiter'));
  console.log('✓ Recruiter routes loaded');
} catch (error) {
  console.error('✗ Error loading recruiter routes:', error.message);
}

try {
  app.use('/api/feedback', require('./routes/feedback'));
  console.log('✓ Feedback routes loaded');
} catch (error) {
  console.error('✗ Error loading feedback routes:', error.message);
}

try {
  app.use('/api/admin', require('./routes/admin'));
  console.log('✓ Admin routes loaded');
} catch (error) {
  console.error('✗ Error loading admin routes:', error.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
