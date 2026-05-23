import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sql from '../db.js';
import { protect, authorize } from '../middleware/auth.js';

// Ensure uploads directory exists
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
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
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const APP_JSON_FIELDS = new Set(['expected_salary', 'resume', 'interview_schedule', 'status_history', 'salary_range', 'location']);

function toCamel(row) {
  if (!row) return null;
  const obj = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    obj[camelKey] = APP_JSON_FIELDS.has(key) && typeof value === 'string' ? JSON.parse(value) : value;
  }
  if (row.id && !obj._id) obj._id = row.id;
  return obj;
}

// @route   POST /api/applications
// @desc    Submit job application
// @access  Private (Candidate only)
router.post('/', protect, authorize('candidate'), upload.single('resume'), [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('coverLetter').optional({ values: 'falsy' }).isLength({ max: 2000 }),
  body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }).trim(),
  body('availability').optional({ values: 'falsy' }).isIn(['Immediate', '2 weeks', '1 month', '2 months', '3+ months'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { jobId } = req.body;

    const jobs = await sql`select * from jobs where id = ${jobId} limit 1`;
    const job = jobs[0];
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const deadline = job.application_deadline ? new Date(job.application_deadline) : null;
    if (job.status !== 'active' || (deadline && deadline < new Date())) {
      return res.status(400).json({ success: false, error: 'Job is no longer accepting applications' });
    }

    const existing = await sql`select id from applications where job_id = ${jobId} and candidate_id = ${req.user.id} limit 1`;
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'You have already applied to this job' });
    }

    // Fetch candidate profile for pre-filling (optional — table may not exist)
    let profile = {};
    try {
      const profiles = await sql`select * from candidate_profiles where user_id = ${req.user.id} limit 1`;
      profile = profiles[0] || {};
    } catch (_) { /* candidate_profiles table doesn't exist yet */ }

    const applicationData = {
      jobId,
      candidateId: req.user.id,
      recruiterId: job.recruiter_id,
      coverLetter: req.body.coverLetter || null,
      portfolio: req.body.portfolio || profile.portfolio_url || null,
      linkedIn: req.body.linkedIn || profile.linkedin_url || null,
      github: req.body.github || profile.github_url || null,
      phone: req.body.phone || profile.phone || null,
      availability: req.body.availability || profile.availability || null,
      expectedSalary: req.body.expectedSalary ? JSON.parse(req.body.expectedSalary) : (profile.expected_salary || null)
    };

    if (req.file) {
      applicationData.resume = JSON.stringify({
        filename: req.file.originalname,
        filepath: req.file.path,
        filesize: req.file.size,
        mimetype: req.file.mimetype
      });
    } else if (profile.resume_url) {
      applicationData.resume = JSON.stringify({
        filename: profile.resume_name,
        filepath: profile.resume_url,
        filesize: 0, // Not stored in profile
        mimetype: 'application/pdf' // Defaulting
      });
    }

    const apps = await sql`
      insert into applications (
        job_id, candidate_id, recruiter_id, cover_letter, portfolio,
        linked_in, github, phone, availability, expected_salary, resume
      ) values (
        ${applicationData.jobId}, ${applicationData.candidateId}, ${applicationData.recruiterId},
        ${applicationData.coverLetter}, ${applicationData.portfolio},
        ${applicationData.linkedIn}, ${applicationData.github}, ${applicationData.phone},
        ${applicationData.availability}, ${JSON.stringify(applicationData.expectedSalary)},
        ${applicationData.resume ? JSON.parse(applicationData.resume) : null}
      )
      returning *
    `;

    await sql`update jobs set application_count = application_count + 1 where id = ${jobId}`;

    const candidate = await sql`select name, email from users where id = ${req.user.id} limit 1`;
    const result = { ...toCamel(apps[0]), candidateId: candidate[0] };

    res.status(201).json({
      success: true,
      data: result,
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
    const conditions = [sql`a.candidate_id = ${req.user.id}`];
    if (status) conditions.push(sql`a.status = ${status}`);

    const where = conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await sql`
      select a.*, j.title, j.company, j.role_type, j.location, j.salary_range, j.status as job_status,
             r.name as recruiter_name, r.company as recruiter_company, r.trust_score
      from applications a
      join jobs j on a.job_id = j.id
      left join recruiters r on a.recruiter_id = r.id
      where ${where}
      order by a.created_at desc
      limit ${parseInt(limit)} offset ${skip}
    `;

    const totalResult = await sql`select count(*) from applications a where ${where}`;
    const total = parseInt(totalResult[0].count);

    const appsWithDetails = applications.map(a => ({
      ...toCamel(a),
      jobId: {
        id: a.job_id,
        title: a.title,
        company: a.company,
        roleType: a.role_type,
        location: a.location,
        salaryRange: a.salary_range,
        status: a.job_status
      },
      recruiterId: {
        id: a.recruiter_id,
        name: a.recruiter_name,
        company: a.recruiter_company,
        trustScore: a.trust_score
      }
    }));

    res.json({
      success: true,
      data: appsWithDetails,
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
    const jobs = await sql`select * from jobs where id = ${req.params.jobId} limit 1`;
    const job = jobs[0];
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const conditions = [sql`a.job_id = ${req.params.jobId}`];
    if (status) conditions.push(sql`a.status = ${status}`);

    const where = conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const sortField = sort.startsWith('-') ? sort.slice(1).replace(/([A-Z])/g, '_$1').toLowerCase() : sort.replace(/([A-Z])/g, '_$1').toLowerCase();
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';

    const applications = await sql`
      select a.*, u.name as candidate_name, u.email as candidate_email, u.created_at as candidate_created
      from applications a
      join users u on a.candidate_id = u.id
      where ${where}
      order by a.${sql(sortField)} ${sortOrder === 'desc' ? sql`desc` : sql`asc`}
      limit ${parseInt(limit)} offset ${skip}
    `;

    const totalResult = await sql`select count(*) from applications a where ${where}`;
    const total = parseInt(totalResult[0].count);

    const statusBreakdown = await sql`
      select status, count(*) from applications where job_id = ${req.params.jobId} group by status
    `;

    const appsWithCandidate = applications.map(a => ({
      ...toCamel(a),
      candidateId: {
        name: a.candidate_name,
        email: a.candidate_email,
        createdAt: a.candidate_created
      }
    }));

    res.json({
      success: true,
      data: appsWithCandidate,
      statusBreakdown: statusBreakdown.map(s => toCamel(s)),
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
    const apps = await sql`
      select a.*, j.title as job_title, j.company as job_company, j.description as job_description,
             j.role_type, j.location, j.salary_range,
             u.name as candidate_name, u.email as candidate_email, u.created_at as candidate_created,
             r.name as recruiter_name, r.company as recruiter_company
      from applications a
      join jobs j on a.job_id = j.id
      join users u on a.candidate_id = u.id
      left join recruiters r on a.recruiter_id = r.id
      where a.id = ${req.params.id}
      limit 1
    `;

    const app = apps[0];
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const isCandidate = req.user.id === app.candidate_id;
    const isRecruiter = req.user.recruiterId === app.recruiter_id;
    const isAdmin = req.user.role === 'admin';

    if (!isCandidate && !isRecruiter && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (isRecruiter && !app.viewed) {
      await sql`update applications set viewed = true, viewed_at = now() where id = ${app.id}`;
    }

    res.json({
      success: true,
      data: {
        ...toCamel(app),
        jobId: { title: app.job_title, company: app.job_company, description: app.job_description, roleType: app.role_type, location: app.location, salaryRange: app.salary_range },
        candidateId: { name: app.candidate_name, email: app.candidate_email, createdAt: app.candidate_created },
        recruiterId: { name: app.recruiter_name, company: app.recruiter_company }
      }
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

    const apps = await sql`
      select a.*, u.name as candidate_name, u.email as candidate_email, j.title as job_title
      from applications a
      join users u on a.candidate_id = u.id
      join jobs j on a.job_id = j.id
      where a.id = ${req.params.id}
      limit 1
    `;

    const app = apps[0];
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const { status, notes } = req.body;
    const historyEntry = JSON.stringify({ status, changedBy: req.user.id, notes: notes || null, changedAt: new Date().toISOString() });

    await sql`
      update applications
      set status = ${status},
          status_history = status_history || ${historyEntry}::jsonb
      where id = ${app.id}
    `;

    const updated = await sql`
      select a.*, u.name as candidate_name, u.email as candidate_email, j.title as job_title
      from applications a
      join users u on a.candidate_id = u.id
      join jobs j on a.job_id = j.id
      where a.id = ${app.id}
      limit 1
    `;

    res.json({
      success: true,
      data: toCamel(updated[0]),
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
    const apps = await sql`select * from applications where id = ${req.params.id} limit 1`;
    if (!apps[0]) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await sql`update applications set recruiter_notes = ${req.body.notes} where id = ${req.params.id}`;
    const updated = await sql`select * from applications where id = ${req.params.id} limit 1`;

    res.json({ success: true, data: toCamel(updated[0]) });
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
    const apps = await sql`select * from applications where id = ${req.params.id} limit 1`;
    if (!apps[0]) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    await sql`update applications set score = ${req.body.score} where id = ${req.params.id}`;
    const updated = await sql`select * from applications where id = ${req.params.id} limit 1`;

    res.json({ success: true, data: toCamel(updated[0]) });
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

    const apps = await sql`
      select a.*, u.name as candidate_name, u.email as candidate_email
      from applications a
      join users u on a.candidate_id = u.id
      where a.id = ${req.params.id}
      limit 1
    `;

    const app = apps[0];
    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const interviewData = JSON.stringify({
      round: req.body.round,
      scheduledAt: req.body.scheduledAt,
      duration: req.body.duration,
      location: req.body.location || null,
      interviewers: req.body.interviewers || [],
      meetingLink: req.body.meetingLink || null
    });

    await sql`
      update applications
      set interview_schedule = interview_schedule || ${interviewData}::jsonb
      where id = ${app.id}
    `;

    const updated = await sql`
      select a.*, u.name as candidate_name, u.email as candidate_email
      from applications a
      join users u on a.candidate_id = u.id
      where a.id = ${app.id}
      limit 1
    `;

    res.json({
      success: true,
      data: toCamel(updated[0]),
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
    const apps = await sql`select * from applications where id = ${req.params.id} limit 1`;
    const app = apps[0];

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (app.candidate_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (['hired', 'offered'].includes(app.status)) {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw application at this stage'
      });
    }

    await sql`update applications set status = 'withdrawn' where id = ${app.id}`;
    await sql`update jobs set application_count = application_count - 1 where id = ${app.job_id}`;

    res.json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/applications/recruiter/dashboard
// @desc    Get recruiter's application dashboard stats
// @access  Private (Recruiter only)
router.get('/recruiter/dashboard', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];

    const statusBreakdown = await sql`
      select status, count(*) from applications where recruiter_id = ${recruiter.id} group by status
    `;

    const recentApplications = await sql`
      select a.*, j.title as job_title, u.name as candidate_name, u.email as candidate_email
      from applications a
      join jobs j on a.job_id = j.id
      join users u on a.candidate_id = u.id
      where a.recruiter_id = ${recruiter.id}
      order by a.created_at desc
      limit 10
    `;

    const totalResult = await sql`select count(*) from applications where recruiter_id = ${recruiter.id}`;
    const unreadResult = await sql`select count(*) from applications where recruiter_id = ${recruiter.id} and viewed = false`;

    const appsWithDetails = recentApplications.map(a => ({
      ...toCamel(a),
      jobId: { title: a.job_title },
      candidateId: { name: a.candidate_name, email: a.candidate_email }
    }));

    res.json({
      success: true,
      data: {
        totalApplications: parseInt(totalResult[0].count),
        unreadApplications: parseInt(unreadResult[0].count),
        statusBreakdown: statusBreakdown.map(s => toCamel(s)),
        recentApplications: appsWithDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
