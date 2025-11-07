import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Recruiter from '../models/Recruiter.js';
import { protect, authorize } from '../middleware/auth.js';

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Recruiter only)
router.post('/', protect, authorize('recruiter', 'admin'), [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('roleType').isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid']),
  body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
  body('salaryRange.min').isNumeric().withMessage('Minimum salary must be a number'),
  body('salaryRange.max').isNumeric().withMessage('Maximum salary must be a number'),
  body('applicationDeadline').isISO8601().withMessage('Valid deadline date required'),
  body('vacancies').isInt({ min: 1 }).withMessage('At least 1 vacancy required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Get recruiter profile
    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const jobData = {
      ...req.body,
      recruiterId: recruiter._id,
      userId: req.user._id,
      company: req.body.company || recruiter.company
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/jobs
// @desc    Get all active jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      status = 'active',
      roleType,
      experienceLevel,
      location,
      skills,
      salaryMin,
      salaryMax,
      search,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { status };

    // Add filters
    if (roleType) query.roleType = roleType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    if (location) {
      query.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      query.requiredSkills = { $in: skillsArray };
    }
    if (salaryMin || salaryMax) {
      query['salaryRange.min'] = { $gte: parseInt(salaryMin) || 0 };
      if (salaryMax) {
        query['salaryRange.max'] = { $lte: parseInt(salaryMax) };
      }
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .populate('recruiterId', 'name company trustScore verifiedLinkedIn')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
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

// @route   GET /api/jobs/my-jobs
// @desc    Get recruiter's own job postings
// @access  Private (Recruiter only)
router.get('/my-jobs', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { recruiterId: recruiter._id };
    
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add application count for each job
    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
      const applicationCount = await Application.countDocuments({ jobId: job._id });
      return { ...job, applicationCount };
    }));

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: jobsWithStats,
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

// @route   GET /api/jobs/:id
// @desc    Get single job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiterId', 'name company email trustScore verifiedLinkedIn averageRating feedbackCount');

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Increment view count
    job.viewCount += 1;
    await job.save();

    // Get application count
    const applicationCount = await Application.countDocuments({ jobId: job._id });

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        applicationCount,
        daysRemaining: job.daysRemaining
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update job posting
// @access  Private (Recruiter - own jobs only)
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    
    // Check ownership
    if (job.recruiterId.toString() !== recruiter._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this job' });
    }

    // Update allowed fields
    const allowedUpdates = [
      'title', 'roleType', 'workMode', 'salaryRange', 'description', 
      'responsibilities', 'requiredSkills', 'preferredSkills', 'location',
      'experienceLevel', 'experienceYears', 'education', 'applicationDeadline',
      'vacancies', 'status', 'benefits', 'contactEmail', 'tags'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Recruiter - own jobs only)
router.delete('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    
    if (job.recruiterId.toString() !== recruiter._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this job' });
    }

    // Don't delete if there are applications
    const applicationCount = await Application.countDocuments({ jobId: job._id });
    if (applicationCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete job with existing applications. Set status to "closed" instead.' 
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/jobs/:id/duplicate
// @desc    Duplicate a job posting
// @access  Private (Recruiter only)
router.post('/:id/duplicate', protect, authorize('recruiter'), async (req, res) => {
  try {
    const originalJob = await Job.findById(req.params.id);
    
    if (!originalJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    
    if (originalJob.recruiterId.toString() !== recruiter._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const duplicateData = originalJob.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.applicationCount;
    delete duplicateData.viewCount;
    
    duplicateData.title = `${duplicateData.title} (Copy)`;
    duplicateData.status = 'draft';

    const newJob = await Job.create(duplicateData);

    res.status(201).json({
      success: true,
      data: newJob
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/jobs/stats/dashboard
// @desc    Get job posting statistics for recruiter
// @access  Private (Recruiter only)
router.get('/stats/dashboard', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({ userId: req.user._id });
    
    const stats = await Job.aggregate([
      { $match: { recruiterId: recruiter._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalApplications: { $sum: '$applicationCount' }
        }
      }
    ]);

    const totalJobs = await Job.countDocuments({ recruiterId: recruiter._id });
    const activeJobs = await Job.countDocuments({ recruiterId: recruiter._id, status: 'active' });

    res.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        breakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;