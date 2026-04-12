import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import sql from '../db.js';
import { protect, authorize } from '../middleware/auth.js';
import clearbitService from '../services/clearbitService.js';
import hunterService from '../services/hunterService.js';
import safeBrowsingService from '../services/safeBrowsingService.js';
import trustScoreService from '../services/trustScoreService.js';

const mapRecruiterRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    company: row.company,
    linkedInUrl: row.linkedin_url,
    companyWebsite: row.company_website,
    position: row.position,
    domainScore: row.domain_score,
    verifiedLinkedIn: row.verified_linkedin,
    trustScore: row.trust_score,
    feedbackCount: row.feedback_count,
    averageRating: row.average_rating,
    sentimentScore: row.sentiment_score,
    isVerified: row.is_verified,
    isFlagged: row.is_flagged,
    flaggedReasons: row.flagged_reasons || [],
    verificationData: row.verification_data,
    metadata: { ...(row.metadata || {}), profileViews: row.profile_views ?? 0 },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

const mapFeedbackRowWithCandidate = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    candidateId: row.candidate_id
      ? { _id: row.candidate_id, name: row.candidate_name }
      : null,
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

    const existingRecruiters = await sql`select * from recruiters where email = ${email} limit 1`;
    let recruiterRow = existingRecruiters[0];
    
    if (!recruiterRow) {
      const created = await sql`
        insert into recruiters (
          user_id,
          name,
          email,
          company,
          linkedin_url,
          company_website,
          position,
          domain_score,
          verified_linkedin,
          trust_score,
          feedback_count,
          average_rating,
          sentiment_score,
          is_verified,
          is_flagged,
          flagged_reasons,
          verification_data,
          metadata,
          profile_views
        )
        values (
          null,
          ${name},
          ${email},
          ${company},
          ${linkedInUrl || null},
          ${companyWebsite || null},
          null,
          ${domainScore},
          ${!!verifiedLinkedIn},
          ${trustScore},
          0,
          0,
          0,
          false,
          false,
          ${sql.array([], 'text')},
          ${{
            clearbitVerified: domainVerification.verified,
            hunterVerified: emailVerification.verified,
            safeBrowsingPassed: urlSafetyCheck.safe,
            lastVerified: new Date().toISOString()
          }},
          ${{}},
          0
        )
        returning *
      `;
      recruiterRow = created[0];
    }

    const recruiter = mapRecruiterRow(recruiterRow);

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

// @route   GET /api/recruiter/leaderboard
router.get('/list/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const recruiters = await sql`
      select
        id,
        name,
        company,
        trust_score as "trustScore",
        feedback_count as "feedbackCount",
        average_rating as "averageRating",
        verified_linkedin as "verifiedLinkedIn"
      from recruiters
      where is_verified = true and is_flagged = false
      order by trust_score desc, feedback_count desc
      limit ${limit}
    `;

    res.json({
      success: true,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/recruiter/search
router.get('/search/query', async (req, res) => {
  try {
    const { q, company } = req.query;

    const conditions = [];
    if (q) {
      const like = `%${q}%`;
      conditions.push(sql`(name ilike ${like} or email ilike ${like})`);
    }
    if (company) {
      conditions.push(sql`company ilike ${`%${company}%`}`);
    }

    const where = conditions.length
      ? sql`where ${sql.join(conditions, sql` and `)}`
      : sql``;

    const recruiters = await sql`
      select
        id,
        name,
        email,
        company,
        trust_score as "trustScore",
        feedback_count as "feedbackCount",
        average_rating as "averageRating"
      from recruiters
      ${where}
      order by trust_score desc
      limit 20
    `;

    res.json({
      success: true,
      count: recruiters.length,
      data: recruiters
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/recruiter/:id
router.get('/:id', async (req, res) => {
  try {
    const recruiters = await sql`select * from recruiters where id = ${req.params.id} limit 1`;
    const recruiterRow = recruiters[0];

    if (!recruiterRow) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    const feedbackRows = await sql`
      select
        f.*,
        u.name as candidate_name
      from feedback f
      join users u on u.id = f.candidate_id
      where f.recruiter_id = ${recruiterRow.id}
      order by f.created_at desc
      limit 10
    `;

    await sql`
      update recruiters
      set profile_views = coalesce(profile_views, 0) + 1,
          updated_at = now()
      where id = ${recruiterRow.id}
    `;

    const recruiter = mapRecruiterRow({
      ...recruiterRow,
      profile_views: (recruiterRow.profile_views ?? 0) + 1
    });
    const feedbacks = feedbackRows.map(mapFeedbackRowWithCandidate);
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

// @route   PUT /api/recruiter/:id
router.put('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const { company, linkedInUrl, companyWebsite, position } = req.body;
    
    const recruiters = await sql`select * from recruiters where id = ${req.params.id} limit 1`;
    const recruiterRow = recruiters[0];

    if (!recruiterRow) {
      return res.status(404).json({ success: false, error: 'Recruiter not found' });
    }

    if (String(req.user.recruiterId) !== String(recruiterRow.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updated = await sql`
      update recruiters
      set
        company = coalesce(${company ?? null}, company),
        linkedin_url = coalesce(${linkedInUrl ?? null}, linkedin_url),
        company_website = coalesce(${companyWebsite ?? null}, company_website),
        position = coalesce(${position ?? null}, position),
        updated_at = now()
      where id = ${recruiterRow.id}
      returning *
    `;
    const recruiter = mapRecruiterRow(updated[0]);

    res.json({
      success: true,
      data: recruiter
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
