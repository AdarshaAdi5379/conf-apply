import express from 'express';
const router = express.Router();
import sql from '../db.js';
import { protect, authorize } from '../middleware/auth.js';

// @route   GET /api/admin/dashboard
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsersRow,
      totalRecruitersRow,
      totalFeedbacksRow,
      flaggedRecruitersRow,
      reportedFeedbacksRow,
      avgTrustRow,
      recentActivity
    ] = await Promise.all([
      sql`select count(*)::int as count from users`,
      sql`select count(*)::int as count from recruiters`,
      sql`select count(*)::int as count from feedback`,
      sql`select count(*)::int as count from recruiters where is_flagged = true`,
      sql`select count(*)::int as count from feedback where is_reported = true`,
      sql`select coalesce(avg(trust_score), 0)::float as avg_trust from recruiters`,
      sql`
        select
          f.id,
          f.rating,
          f.comment,
          f.is_reported as "isReported",
          f.report_reason as "reportReason",
          f.created_at as "createdAt",
          json_build_object('name', u.name, 'email', u.email, '_id', u.id) as "candidateId",
          json_build_object('name', r.name, 'company', r.company, '_id', r.id) as "recruiterId"
        from feedback f
        join users u on u.id = f.candidate_id
        join recruiters r on r.id = f.recruiter_id
        order by f.created_at desc
        limit 10
      `
    ]);

    const totalUsers = totalUsersRow[0]?.count || 0;
    const totalRecruiters = totalRecruitersRow[0]?.count || 0;
    const totalFeedbacks = totalFeedbacksRow[0]?.count || 0;
    const flaggedRecruiters = flaggedRecruitersRow[0]?.count || 0;
    const reportedFeedbacks = reportedFeedbacksRow[0]?.count || 0;
    const avgTrustScore = avgTrustRow[0]?.avg_trust || 0;

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
    const recruiters = await sql`
      select
        r.*,
        json_build_object('_id', u.id, 'name', u.name, 'email', u.email) as "userId"
      from recruiters r
      left join users u on u.id = r.user_id
      where r.is_flagged = true
      order by r.trust_score asc
    `;

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
    const feedbacks = await sql`
      select
        f.*,
        json_build_object('_id', u.id, 'name', u.name, 'email', u.email) as "candidateId",
        json_build_object('_id', r.id, 'name', r.name, 'company', r.company, 'email', r.email) as "recruiterId"
      from feedback f
      join users u on u.id = f.candidate_id
      join recruiters r on r.id = f.recruiter_id
      where f.is_reported = true
      order by f.created_at desc
    `;

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
    
    const recruiters = await sql`select * from recruiters where id = ${req.params.id} limit 1`;
    const recruiter = recruiters[0];
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const updated = await sql`
      update recruiters
      set
        is_flagged = ${!!isFlagged},
        flagged_reasons = ${sql.array(reasons || [], 'text')},
        updated_at = now()
      where id = ${req.params.id}
      returning *
    `;

    res.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/admin/feedback/:id
router.delete('/feedback/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedbackRows = await sql`select id from feedback where id = ${req.params.id} limit 1`;
    if (feedbackRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Feedback not found' });
    }

    await sql`delete from feedback where id = ${req.params.id}`;

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
