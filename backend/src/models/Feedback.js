const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  sentimentScore: {
    type: Number,
    default: 0,
    min: -100,
    max: 100
  },
  tags: [{
    type: String,
    enum: ['responsive', 'professional', 'ghosted', 'fake', 'helpful', 'slow', 'transparent', 'misleading'],
    trim: true
  }],
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    enum: ['fake_recruiter', 'ghosting', 'misleading_job', 'scam', 'unprofessional', 'other'],
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  recruiterResponse: {
    type: String,
    trim: true,
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
feedbackSchema.index({ recruiterId: 1, createdAt: -1 });
feedbackSchema.index({ candidateId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);