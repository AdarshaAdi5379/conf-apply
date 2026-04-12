import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import sql from '../db.js';
import { protect } from '../middleware/auth.js';
import trustScoreService from '../services/trustScoreService.js';

const mapFeedbackRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    candidateId: row.candidate_id,
    recruiterId: row.recruiter_id,
    rating: row.rating,
    comment: row.comment,
    sentimentScore: row.sentiment_score,
    tags: row.tags || [],
    isReported: row.is_reported,
    reportReason: row.report_reason,
    verified: row.verified,
    recruiterResponse: row.recruiter_response,
    respondedAt: row.responded_at,
    createdAt: row.created_at
  };
};

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

    const recruiters = await sql`select * from recruiters where id = ${recruiterId} limit 1`;
    const recruiter = recruiters[0];
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const existingFeedback = await sql`
      select id
      from feedback
      where candidate_id = ${req.user._id} and recruiter_id = ${recruiterId}
      limit 1
    `;

    if (existingFeedback.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already submitted feedback for this recruiter' 
      });
    }

    const sentimentScore = trustScoreService.analyzeSentiment(comment);

    const inserted = await sql`
      insert into feedback (
        candidate_id,
        recruiter_id,
        rating,
        comment,
        sentiment_score,
        tags,
        is_reported,
        report_reason,
        verified,
        recruiter_response,
        responded_at
      )
      values (
        ${req.user._id},
        ${recruiterId},
        ${rating},
        ${comment},
        ${sentimentScore},
        ${sql.array(tags || [], 'text')},
        ${!!reportReason},
        ${reportReason || null},
        false,
        null,
        null
      )
      returning *
    `;
    const feedbackRow = inserted[0];

    const statsRows = await sql`
      select
        count(*)::int as count,
        coalesce(avg(rating), 0)::float as avg_rating,
        coalesce(avg(sentiment_score), 0)::float as avg_sentiment
      from feedback
      where recruiter_id = ${recruiterId}
    `;

    const stats = statsRows[0] || { count: 0, avg_rating: 0, avg_sentiment: 0 };
    const averageRating = stats.avg_rating;
    const averageSentiment = await trustScoreService.calculateAverageSentiment(recruiterId);

    const newTrustScore = trustScoreService.calculateTrustScore(
      recruiter.domain_score,
      recruiter.verified_linkedin,
      averageRating,
      averageSentiment
    );

    const flagCheck = trustScoreService.shouldFlag(
      newTrustScore,
      stats.count,
      averageRating,
      averageSentiment
    );

    await sql`
      update recruiters
      set
        feedback_count = ${stats.count},
        average_rating = ${averageRating},
        sentiment_score = ${averageSentiment},
        trust_score = ${newTrustScore},
        is_flagged = ${flagCheck.shouldFlag},
        flagged_reasons = ${sql.array(flagCheck.shouldFlag ? flagCheck.reasons : [], 'text')},
        updated_at = now()
      where id = ${recruiterId}
    `;

    const populated = await sql`
      select f.*, u.name as candidate_name
      from feedback f
      join users u on u.id = f.candidate_id
      where f.id = ${feedbackRow.id}
      limit 1
    `;
    const feedback = {
      ...mapFeedbackRow(populated[0]),
      candidateId: { _id: populated[0].candidate_id, name: populated[0].candidate_name }
    };

    res.status(201).json({
      success: true,
      data: feedback,
      recruiterUpdate: {
        trustScore: newTrustScore,
        averageRating,
        feedbackCount: stats.count,
        isFlagged: flagCheck.shouldFlag
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

    const feedbackRows = await sql`
      select f.*, u.name as candidate_name
      from feedback f
      join users u on u.id = f.candidate_id
      where f.recruiter_id = ${req.params.recruiterId}
      order by f.created_at desc
      limit ${limit}
      offset ${skip}
    `;

    const totalRows = await sql`
      select count(*)::int as total
      from feedback
      where recruiter_id = ${req.params.recruiterId}
    `;
    const total = totalRows[0]?.total || 0;
    const feedbacks = feedbackRows.map((r) => ({
      ...mapFeedbackRow(r),
      candidateId: { _id: r.candidate_id, name: r.candidate_name }
    }));

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

    const rows = await sql`select * from feedback where id = ${req.params.id} limit 1`;
    const feedbackRow = rows[0];
    
    if (!feedbackRow) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    if (String(req.user.recruiterId) !== String(feedbackRow.recruiter_id)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updated = await sql`
      update feedback
      set recruiter_response = ${req.body.response},
          responded_at = now()
      where id = ${feedbackRow.id}
      returning *
    `;

    res.json({
      success: true,
      data: mapFeedbackRow(updated[0])
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/feedback/my-feedback
router.get('/my-feedback', protect, async (req, res) => {
  try {
    const feedbackRows = await sql`
      select
        f.*,
        r.name as recruiter_name,
        r.company as recruiter_company,
        r.trust_score as recruiter_trust_score
      from feedback f
      join recruiters r on r.id = f.recruiter_id
      where f.candidate_id = ${req.user._id}
      order by f.created_at desc
    `;

    const feedbacks = feedbackRows.map((r) => ({
      ...mapFeedbackRow(r),
      recruiterId: {
        _id: r.recruiter_id,
        name: r.recruiter_name,
        company: r.recruiter_company,
        trustScore: r.recruiter_trust_score
      }
    }));

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
