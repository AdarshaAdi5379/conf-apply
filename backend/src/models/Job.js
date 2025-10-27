const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  roleType: {
    type: String,
    required: [true, 'Role type is required'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid'],
    default: 'Full-time'
  },
  workMode: {
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid'],
    default: 'On-site'
  },
  salaryRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']
    },
    period: {
      type: String,
      default: 'yearly',
      enum: ['hourly', 'monthly', 'yearly']
    }
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  responsibilities: [{
    type: String,
    trim: true
  }],
  requiredSkills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  preferredSkills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  location: {
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    isRemote: {
      type: Boolean,
      default: false
    }
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive']
  },
  experienceYears: {
    min: {
      type: Number,
      default: 0,
      min: 0
    },
    max: {
      type: Number,
      default: 10,
      min: 0
    }
  },
  education: {
    type: String,
    enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Any'],
    default: 'Bachelor'
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  vacancies: {
    type: Number,
    required: [true, 'Number of vacancies is required'],
    min: [1, 'Must have at least 1 vacancy'],
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'filled'],
    default: 'active',
    index: true
  },
  applicationCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  benefits: [{
    type: String,
    trim: true
  }],
  companyLogo: {
    type: String,
    default: null
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  externalUrl: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    postedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date
    }
  },
  seo: {
    keywords: [String],
    metaDescription: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ recruiterId: 1, status: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ 'location.country': 1, 'location.city': 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ roleType: 1 });
jobSchema.index({ title: 'text', description: 'text' });

// Virtual for days remaining
jobSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.applicationDeadline);
  const diff = deadline - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Pre-save middleware
jobSchema.pre('save', function(next) {
  this.metadata.lastUpdated = new Date();
  
  // Auto-close if deadline passed
  if (new Date() > this.applicationDeadline && this.status === 'active') {
    this.status = 'closed';
  }
  
  next();
});

// Instance method to check if job is still accepting applications
jobSchema.methods.isAcceptingApplications = function() {
  return this.status === 'active' && 
         new Date() < this.applicationDeadline && 
         this.applicationCount < (this.vacancies * 10); // Max 10x applications
};

// Static method to get active jobs
jobSchema.statics.getActiveJobs = function(filters = {}) {
  return this.find({
    status: 'active',
    applicationDeadline: { $gt: new Date() },
    ...filters
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Job', jobSchema);