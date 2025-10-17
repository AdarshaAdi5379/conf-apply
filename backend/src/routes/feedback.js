const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Recruiter = require('../models/Recruiter');
const { protect } = require('../middleware/auth');
const trustScoreService = require('../services/trustScoreService');

// @route   POST /api/feedback
router.post('/', protect, [
  body('recruiterId').notEmpty().withMessage('Recruiter ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('reportReason').optional().isIn(['fake_recruiter', 'ghosting', 'misleading_job', 'scam', 'unprofessional', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { recruiterId, rating, comment, tags, reportReason } = req.body;

    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const existingFeedback = await Feedback.findOne({
      candidateId: req.user._id,
      recruiterId
    });

    if (existingFeedback) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already submitted feedback for this recruiter' 
      });
    }

    const sentimentScore = trustScoreService.analyzeSentiment(comment);

    const feedback = await Feedback.create({
      candidateId: req.user._id,
      recruiterId,
      rating,
      comment,
      sentimentScore,
      tags: tags || [],
      isReported: !!reportReason,
      reportReason: reportReason || null
    });

    const allFeedbacks = await Feedback.find({ recruiterId });
    const totalRating = allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
    const averageRating = totalRating / allFeedbacks.length;
    
    const averageSentiment = await trustScoreService.calculateAverageSentiment(recruiterId);

    const newTrustScore = trustScoreService.calculateTrustScore(
      recruiter.domainScore,
      recruiter.verifiedLinkedIn,
      averageRating,
      averageSentiment
    );

    const flagCheck = trustScoreService.shouldFlag(
      newTrustScore,
      allFeedbacks.length,
      averageRating,
      averageSentiment
    );

    recruiter.feedbackCount = allFeedbacks.length;
    recruiter.averageRating = averageRating;
    recruiter.sentimentScore = averageSentiment;
    recruiter.trustScore = newTrustScore;
    
    if (flagCheck.shouldFlag) {
      recruiter.isFlagged = true;
      recruiter.flaggedReasons = flagCheck.reasons;
    }

    await recruiter.save();
    await feedback.populate('candidateId', 'name');

    res.status(201).json({
      success: true,
      data: feedback,
      recruiterUpdate: {
        trustScore: newTrustScore,
        averageRating,
        feedbackCount: allFeedbacks.length,
        isFlagged: recruiter.isFlagged
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/feedback/recruiter/:recruiterId
router.get('/recruiter/:recruiterId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ recruiterId: req.params.recruiterId })
      .populate('candidateId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments({ recruiterId: req.params.recruiterId });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/feedback/:id/respond
router.put('/:id/respond', protect, [
  body('response').trim().isLength({ min: 10, max: 500 }).withMessage('Response must be 10-500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    if (req.user.recruiterId.toString() !== feedback.recruiterId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    feedback.recruiterResponse = req.body.response;
    feedback.respondedAt = new Date();
    await feedback.save();

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/feedback/my-feedback
router.get('/my-feedback', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ candidateId: req.user._id })
      .populate('recruiterId', 'name company trustScore')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;