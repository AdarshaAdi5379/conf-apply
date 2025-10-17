const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Recruiter = require('../models/Recruiter');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');
const clearbitService = require('../services/clearbitService');
const hunterService = require('../services/hunterService');
const safeBrowsingService = require('../services/safeBrowsingService');
const trustScoreService = require('../services/trustScoreService');

// @route   POST /api/recruiter/verify
router.post('/verify', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('linkedInUrl').optional().isURL().withMessage('Valid LinkedIn URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, company, linkedInUrl, companyWebsite } = req.body;
    const emailDomain = email.split('@')[1];

    const [emailVerification, domainVerification, urlSafetyCheck] = await Promise.all([
      hunterService.verifyEmail(email),
      clearbitService.verifyCompanyDomain(emailDomain),
      companyWebsite ? safeBrowsingService.checkUrl(companyWebsite) : Promise.resolve({ safe: true, score: 100 })
    ]);

    const domainScore = Math.round((emailVerification.score + domainVerification.score) / 2);
    const verifiedLinkedIn = linkedInUrl && linkedInUrl.includes('linkedin.com');
    const trustScore = trustScoreService.calculateTrustScore(domainScore, verifiedLinkedIn, 0, 50);

    const verificationData = {
      domainScore,
      trustScore,
      verifiedLinkedIn,
      verificationDetails: {
        emailVerification: {
          verified: emailVerification.verified,
          score: emailVerification.score,
          status: emailVerification.status,
          isDisposable: emailVerification.isDisposable
        },
        domainVerification: {
          verified: domainVerification.verified,
          score: domainVerification.score,
          companyData: domainVerification.data
        },
        urlSafety: {
          safe: urlSafetyCheck.safe,
          score: urlSafetyCheck.score
        }
      }
    };

    let recruiter = await Recruiter.findOne({ email });
    
    if (!recruiter) {
      recruiter = new Recruiter({
        name,
        email,
        company,
        linkedInUrl,
        companyWebsite,
        domainScore,
        verifiedLinkedIn,
        trustScore,
        verificationData: {
          clearbitVerified: domainVerification.verified,
          hunterVerified: emailVerification.verified,
          safeBrowsingPassed: urlSafetyCheck.safe,
          lastVerified: new Date()
        }
      });
      await recruiter.save();
    }

    res.json({
      success: true,
      data: {
        recruiterId: recruiter._id,
        ...verificationData,
        trustLevel: trustScoreService.getTrustLevel(trustScore)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/recruiter/:id
router.get('/:id', async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.params.id);
    
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const feedbacks = await Feedback.find({ recruiterId: recruiter._id })
      .populate('candidateId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    recruiter.metadata.profileViews += 1;
    await recruiter.save();

    const insights = trustScoreService.generateInsights(recruiter);

    res.json({
      success: true,
      data: {
        recruiter,
        feedbacks,
        insights,
        trustLevel: trustScoreService.getTrustLevel(recruiter.trustScore)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/recruiter/leaderboard
router.get('/list/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recruiters = await Recruiter.find({ isVerified: true, isFlagged: false })
      .sort({ trustScore: -1, feedbackCount: -1 })
      .limit(limit)
      .select('name company trustScore feedbackCount averageRating verifiedLinkedIn');

    res.json({
      success: true,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/recruiter/:id
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { company, linkedInUrl, companyWebsite, position } = req.body;
    
    const recruiter = await Recruiter.findById(req.params.id);
    
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    if (req.user.recruiterId.toString() !== recruiter._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (company) recruiter.company = company;
    if (linkedInUrl) recruiter.linkedInUrl = linkedInUrl;
    if (companyWebsite) recruiter.companyWebsite = companyWebsite;
    if (position) recruiter.position = position;

    await recruiter.save();

    res.json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/recruiter/search
router.get('/search/query', async (req, res) => {
  try {
    const { q, company } = req.query;
    
    const query = {};
    
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    const recruiters = await Recruiter.find(query)
      .sort({ trustScore: -1 })
      .limit(20)
      .select('name email company trustScore feedbackCount averageRating');

    res.json({
      success: true,
      count: recruiters.length,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;