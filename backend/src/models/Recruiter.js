const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Recruiter name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  linkedInUrl: {
    type: String,
    trim: true,
    default: null
  },
  companyWebsite: {
    type: String,
    trim: true,
    default: null
  },
  position: {
    type: String,
    trim: true,
    default: null
  },
  domainScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verifiedLinkedIn: {
    type: Boolean,
    default: false
  },
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  feedbackCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  sentimentScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flaggedReasons: [{
    type: String,
    trim: true
  }],
  verificationData: {
    clearbitVerified: { type: Boolean, default: false },
    hunterVerified: { type: Boolean, default: false },
    safeBrowsingPassed: { type: Boolean, default: false },
    lastVerified: { type: Date, default: null }
  },
  metadata: {
    profileViews: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    avgResponseTime: { type: String, default: null }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
recruiterSchema.index({ email: 1 });
recruiterSchema.index({ trustScore: -1 });
recruiterSchema.index({ company: 1 });

// Update timestamp on save
recruiterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Recruiter', recruiterSchema);