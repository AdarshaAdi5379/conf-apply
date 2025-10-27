const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/resumes/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @route   POST /api/applications
// @desc    Submit job application
// @access  Private (Candidate only)
router.post('/', protect, authorize('candidate'), upload.single('resume'), [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('coverLetter').optional().isLength({ max: 2000 }),
  body('phone').optional().isMobilePhone(),
  body('availability').optional().isIn(['Immediate', '2 weeks', '1 month', '2 months', '3+ months'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { jobId } = req.body;

    // Check if job exists and is accepting applications
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    if (!job.isAcceptingApplications()) {
      return res.status(400).json({ success: false, error: 'Job is no longer accepting applications' });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already applied to this job' 
      });
    }

    // Prepare application data
    const applicationData = {
      jobId,
      candidateId: req.user._id,
      recruiterId: job.recruiterId,
      coverLetter: req.body.coverLetter,
      portfolio: req.body.portfolio,
      linkedIn: req.body.linkedIn,
      github: req.body.github,
      phone: req.body.phone,
      availability: req.body.availability,
      expectedSalary: req.body.expectedSalary ? JSON.parse(req.body.expectedSalary) : undefined
    };

    // Add resume file info if uploaded
    if (req.file) {
      applicationData.resume = {
        filename: req.file.originalname,
        filepath: req.file.path,
        filesize: req.file.size,
        mimetype: req.file.mimetype
      };
    }

    // Create application
    const application = await Application.create(applicationData);

    // Increment job application count
    job.applicationCount += 1;
    await job.save();

    // Populate candidate info
    await application.populate('candidateId', 'name email');

    // TODO: Send email notification to recruiter

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/applications/my-applications
// @desc    Get candidate's own applications
// @access  Private (Candidate only)
router.get('/my-applications', protect, authorize('candidate'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { candidateId: req.user._id };
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate('jobId', 'title company roleType location salaryRange status')
      .populate('recruiterId', 'name company trustScore')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/applications/job/:jobId
// @desc    Get all applications for a specific job
// @access  Private (Recruiter - own jobs only)
router.get('/job/:jobId', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const query = { jobId: req.params.jobId };
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await Application.find(query)
      .populate('candidateId', 'name email createdAt')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Application.countDocuments(query);

    // Get status breakdown
    const statusBreakdown = await Application.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: applications,
      statusBreakdown,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/applications/:id
// @desc    Get single application details
// @access  Private (Recruiter/Candidate - own only)
router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId')
      .populate('candidateId', 'name email createdAt')
      .populate('recruiterId', 'name company');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Check authorization
    const isCandidate = req.user._id.toString() === application.candidateId._id.toString();
    const isRecruiter = req.user.recruiterId && 
                       req.user.recruiterId.toString() === application.recruiterId._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCandidate && !isRecruiter && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Mark as viewed if recruiter is viewing
    if (isRecruiter && !application.viewed) {
      application.viewed = true;
      application.viewedAt = new Date();
      await application.save();
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/applications/:id/status
// @desc    Update application status
// @access  Private (Recruiter only)
router.put('/:id/status', protect, authorize('recruiter', 'admin'), [
  body('status').isIn(['applied', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn', 'hired']),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const { status, notes } = req.body;

    // Update status with history
    await application.updateStatus(status, req.user._id, notes);

    // TODO: Send email notification to candidate about status change

    res.json({
      success: true,
      data: application,
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/applications/:id/notes
// @desc    Add/update recruiter notes
// @access  Private (Recruiter only)
router.put('/:id/notes', protect, authorize('recruiter', 'admin'), [
  body('notes').isLength({ max: 1000 })
], async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    application.recruiterNotes = req.body.notes;
    await application.save();

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/applications/:id/score
// @desc    Update application score
// @access  Private (Recruiter only)
router.put('/:id/score', protect, authorize('recruiter', 'admin'), [
  body('score').isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    application.score = req.body.score;
    await application.save();

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/applications/:id/interview
// @desc    Schedule interview
// @access  Private (Recruiter only)
router.post('/:id/interview', protect, authorize('recruiter', 'admin'), [
  body('round').isIn(['Phone Screen', 'Technical', 'HR', 'Manager', 'Final', 'Other']),
  body('scheduledAt').isISO8601(),
  body('duration').isInt({ min: 15, max: 480 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const interviewData = {
      round: req.body.round,
      scheduledAt: req.body.scheduledAt,
      duration: req.body.duration,
      location: req.body.location,
      interviewers: req.body.interviewers,
      meetingLink: req.body.meetingLink
    };

    application.interviewSchedule.push(interviewData);
    await application.save();

    // TODO: Send interview invitation email to candidate

    res.json({
      success: true,
      data: application,
      message: 'Interview scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/applications/:id
// @desc    Withdraw application
// @access  Private (Candidate - own only)
router.delete('/:id', protect, authorize('candidate'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Don't allow withdrawal if already hired or offered
    if (['hired', 'offered'].includes(application.status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot withdraw application at this stage' 
      });
    }

    application.status = 'withdrawn';
    await application.save();

    // Decrement job application count
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } });

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/applications/recruiter/dashboard
// @desc    Get recruiter's application dashboard stats
// @access  Private (Recruiter only)
router.get('/recruiter/dashboard', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ userId: req.user._id });

    const stats = await Application.getStats(recruiter._id);

    const recentApplications = await Application.find({ recruiterId: recruiter._id })
      .populate('jobId', 'title')
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const totalApplications = await Application.countDocuments({ recruiterId: recruiter._id });
    const unreadApplications = await Application.countDocuments({ 
      recruiterId: recruiter._id, 
      viewed: false 
    });

    res.json({
      success: true,
      data: {
        totalApplications,
        unreadApplications,
        statusBreakdown: stats,
        recentApplications
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;