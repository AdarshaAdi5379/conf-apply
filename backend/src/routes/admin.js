const express = require('express');
const router = express.Router();
const Recruiter = require('../models/Recruiter');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalRecruiters,
      totalFeedbacks,
      flaggedRecruiters,
      reportedFeedbacks,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Recruiter.countDocuments(),
      Feedback.countDocuments(),
      Recruiter.countDocuments({ isFlagged: true }),
      Feedback.countDocuments({ isReported: true }),
      Feedback.find().sort({ createdAt: -1 }).limit(10)
        .populate('candidateId', 'name email')
        .populate('recruiterId', 'name company')
    ]);

    const recruiters = await Recruiter.find();
    const avgTrustScore = recruiters.length > 0
      ? recruiters.reduce((sum, r) => sum + r.trustScore, 0) / recruiters.length
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalRecruiters,
          totalFeedbacks,
          flaggedRecruiters,
          reportedFeedbacks,
          avgTrustScore: Math.round(avgTrustScore)
        },
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/admin/flagged-recruiters
router.get('/flagged-recruiters', protect, authorize('admin'), async (req, res) => {
  try {
    const recruiters = await Recruiter.find({ isFlagged: true })
      .sort({ trustScore: 1 })
      .populate('userId', 'name email');

    res.json({
      success: true,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/admin/reported-feedback
router.get('/reported-feedback', protect, authorize('admin'), async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ isReported: true })
      .sort({ createdAt: -1 })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name company email');

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/admin/recruiter/:id/flag
router.put('/recruiter/:id/flag', protect, authorize('admin'), async (req, res) => {
  try {
    const { isFlagged, reasons } = req.body;
    
    const recruiter = await Recruiter.findById(req.params.id);
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    recruiter.isFlagged = isFlagged;
    recruiter.flaggedReasons = reasons || [];
    await recruiter.save();

    res.json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/admin/feedback/:id
router.delete('/feedback/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    await feedback.deleteOne();

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;