const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true,
    index: true
  },
  resume: {
    filename: {
      type: String,
      required: true
    },
    filepath: {
      type: String,
      required: true
    },
    filesize: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    }
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  portfolio: {
    type: String,
    trim: true
  },
  linkedIn: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required']
  },
  availability: {
    type: String,
    enum: ['Immediately', '1-2 weeks', '1 month', '2 months', 'Negotiable'],
    default: 'Negotiable'
  },
  expectedSalary: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'rejected', 'hired', 'withdrawn', 'withdrawn_by_candidate'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  recruiterNotes: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  interviewSchedule: [{
    round: {
      type: String,
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      default: 60 // minutes
    },
    location: {
      type: String,
      trim: true
    },
    meetingLink: {
      type: String,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  viewed: {
    type: Boolean,
    default: false
  },
  viewedAt: {
    type: Date,
    default: null
  },
  evaluatedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    source: {
      type: String,
      default: 'direct'
    },
    referralSource: String,
    autoApplied: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes for faster queries
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ candidateId: 1, createdAt: -1 });
applicationSchema.index({ recruiterId: 1, status: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

// Pre-save middleware to add status to history
applicationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    
    const historyEntry = {
      status: this.status,
      changedAt: new Date(),
      changedBy: this.candidateId, // Will be updated by the route
      notes: ''
    };
    
    this.statusHistory.push(historyEntry);
  }
  
  next();
});

// Instance method to update status
applicationSchema.methods.updateStatus = async function(newStatus, changedBy, notes = '') {
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: changedBy,
    notes: notes
  });
  
  await this.save();
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status, jobId) {
  const query = { status };
  if (jobId) query.jobId = jobId;
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Application', applicationSchema);


