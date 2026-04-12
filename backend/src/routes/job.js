import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import sql from '../db.js';
import { protect, authorize } from '../middleware/auth.js';

function toCamel(row) {
  if (!row) return null;
  const obj = {};
  for (const [key, value] of Object.entries(row)) {
    obj[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return obj;
}

// @route   POST /api/jobs
// @desc    Create a new job posting
// @access  Private (Recruiter only)
router.post('/', protect, authorize('recruiter', 'admin'), [
  body('title').trim().notEmpty().withMessage('Job title is required'),
  body('company').trim().notEmpty().withMessage('Company name is required'),
  body('roleType').isIn(['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote', 'Hybrid']),
  body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
  body('vacancies').optional().isInt({ min: 1 }).withMessage('At least 1 vacancy required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const {
      title, company, roleType, workMode, experienceLevel, experienceYears,
      description, responsibilities = [], requiredSkills = [], preferredSkills = [],
      education, location = {}, salaryRange = {}, benefits = [], tags = [],
      contactEmail, vacancies = 1, applicationDeadline, status = 'draft'
    } = req.body;

    const jobs = await sql`
      insert into jobs (
        recruiter_id, user_id, title, company, role_type, work_mode,
        experience_level, experience_years, description, responsibilities,
        required_skills, preferred_skills, education, location, salary_range,
        benefits, tags, contact_email, vacancies, application_deadline, status
      ) values (
        ${recruiter.id}, ${req.user.id}, ${title}, ${company || recruiter.name}, ${roleType}, ${workMode || null},
        ${experienceLevel || null}, ${experienceYears || null}, ${description}, ${responsibilities},
        ${requiredSkills}, ${preferredSkills}, ${education || null}, ${JSON.stringify(location)}, ${JSON.stringify(salaryRange)},
        ${benefits}, ${tags}, ${contactEmail || null}, ${vacancies}, ${applicationDeadline || null}, ${status}
      )
      returning *
    `;

    res.status(201).json({ success: true, data: toCamel(jobs[0]) });
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

    const conditions = [sql`j.status = ${status}`];
    if (roleType) conditions.push(sql`j.role_type = ${roleType}`);
    if (experienceLevel) conditions.push(sql`j.experience_level = ${experienceLevel}`);
    if (location) {
      conditions.push(sql`(j.location->>'city' ilike ${'%' + location + '%'} or j.location->>'country' ilike ${'%' + location + '%'})`);
    }
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      conditions.push(sql`j.required_skills && ${skillsArray}`);
    }
    if (salaryMin) {
      conditions.push(sql`(j.salary_range->>'max')::numeric >= ${parseInt(salaryMin)}`);
    }
    if (salaryMax) {
      conditions.push(sql`(j.salary_range->>'min')::numeric <= ${parseInt(salaryMax)}`);
    }
    if (search) {
      conditions.push(sql`(j.title ilike ${'%' + search + '%'} or j.description ilike ${'%' + search + '%'} or j.company ilike ${'%' + search + '%'})`);
    }

    const where = conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`);

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
    const safeField = sortField.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/[^a-z_]/g, '');
    const orderBy = sql`j.${sql(safeField)} ${sortOrder === 'desc' ? sql`desc` : sql`asc`}`;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await sql`
      select j.*, r.name as recruiter_name, r.company as recruiter_company,
             r.trust_score, r.verified_linkedin
      from jobs j
      left join recruiters r on j.recruiter_id = r.id
      where ${where}
      order by ${orderBy}
      limit ${parseInt(limit)} offset ${skip}
    `;

    const totalResult = await sql`select count(*) from jobs j where ${where}`;
    const total = parseInt(totalResult[0].count);

    const jobsWithRecruiter = jobs.map(j => ({
      ...toCamel(j),
      recruiter: {
        name: j.recruiter_name,
        company: j.recruiter_company,
        trustScore: j.trust_score,
        verifiedLinkedIn: j.verified_linkedin
      }
    }));

    res.json({
      success: true,
      data: jobsWithRecruiter,
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
    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];
    if (!recruiter) {
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const conditions = [sql`recruiter_id = ${recruiter.id}`];
    if (status) conditions.push(sql`status = ${status}`);

    const where = conditions.reduce((acc, c, i) => i === 0 ? c : sql`${acc} and ${c}`);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await sql`
      select j.*, 
        (select count(*)::int from applications where job_id = j.id) as application_count
      from jobs j
      where ${where}
      order by created_at desc
      limit ${parseInt(limit)} offset ${skip}
    `;

    const totalResult = await sql`select count(*) from jobs j where ${where}`;
    const total = parseInt(totalResult[0].count);

    const jobsWithStats = jobs.map(job => ({
      ...toCamel(job),
      applicationCount: job.application_count
    }));

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
    const jobs = await sql`
      select j.*, r.name as recruiter_name, r.company as recruiter_company,
             r.trust_score, r.verified_linkedin, r.average_rating,
             r.feedback_count
      from jobs j
      left join recruiters r on j.recruiter_id = r.id
      where j.id = ${req.params.id}
      limit 1
    `;

    const job = jobs[0];
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    await sql`update jobs set view_count = view_count + 1 where id = ${job.id}`;

    const appCount = await sql`select count(*) from applications where job_id = ${job.id}`;

    const deadline = job.application_deadline ? new Date(job.application_deadline) : null;
    const daysRemaining = deadline ? Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)) : null;

    res.json({
      success: true,
      data: {
        ...toCamel(job),
        applicationCount: parseInt(appCount[0].count),
        daysRemaining
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
    const jobs = await sql`select * from jobs where id = ${req.params.id} limit 1`;
    const job = jobs[0];
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];

    if (job.recruiter_id !== recruiter?.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to update this job' });
    }

    const allowedUpdates = [
      'title', 'roleType', 'workMode', 'salaryRange', 'description',
      'responsibilities', 'requiredSkills', 'preferredSkills', 'location',
      'experienceLevel', 'experienceYears', 'education', 'applicationDeadline',
      'vacancies', 'status', 'benefits', 'contactEmail', 'tags'
    ];

    const updates = [];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        const col = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        const value = (field === 'salaryRange' || field === 'location') ? JSON.stringify(req.body[field]) : req.body[field];
        updates.push(sql`${sql(col)} = ${value}`);
      }
    });

    if (updates.length > 0) {
      await sql`update jobs set ${sql.join(updates, sql`, `)} where id = ${job.id}`;
    }

    const updated = await sql`select * from jobs where id = ${job.id} limit 1`;
    res.json({ success: true, data: toCamel(updated[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete job posting
// @access  Private (Recruiter - own jobs only)
router.delete('/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
  try {
    const jobs = await sql`select * from jobs where id = ${req.params.id} limit 1`;
    const job = jobs[0];
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];

    if (job.recruiter_id !== recruiter?.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this job' });
    }

    const appCount = await sql`select count(*) from applications where job_id = ${job.id}`;
    if (parseInt(appCount[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete job with existing applications. Set status to "closed" instead.'
      });
    }

    await sql`delete from jobs where id = ${job.id}`;
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/jobs/:id/duplicate
// @desc    Duplicate a job posting
// @access  Private (Recruiter only)
router.post('/:id/duplicate', protect, authorize('recruiter'), async (req, res) => {
  try {
    const jobs = await sql`select * from jobs where id = ${req.params.id} limit 1`;
    const originalJob = jobs[0];
    if (!originalJob) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];

    if (originalJob.recruiter_id !== recruiter?.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const newJobs = await sql`
      insert into jobs (
        recruiter_id, user_id, title, company, role_type, work_mode,
        experience_level, experience_years, description, responsibilities,
        required_skills, preferred_skills, education, location, salary_range,
        benefits, tags, contact_email, vacancies, application_deadline, status
      ) values (
        ${recruiter.id}, ${req.user.id}, ${originalJob.title + ' (Copy)'}, ${originalJob.company},
        ${originalJob.role_type}, ${originalJob.work_mode},
        ${originalJob.experience_level}, ${originalJob.experience_years}, ${originalJob.description},
        ${originalJob.responsibilities}, ${originalJob.required_skills}, ${originalJob.preferred_skills},
        ${originalJob.education}, ${originalJob.location}, ${originalJob.salary_range},
        ${originalJob.benefits}, ${originalJob.tags}, ${originalJob.contact_email},
        ${originalJob.vacancies}, ${originalJob.application_deadline}, 'draft'
      )
      returning *
    `;

    res.status(201).json({ success: true, data: toCamel(newJobs[0]) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   GET /api/jobs/stats/dashboard
// @desc    Get job posting statistics for recruiter
// @access  Private (Recruiter only)
router.get('/stats/dashboard', protect, authorize('recruiter'), async (req, res) => {
  try {
    const recruiters = await sql`select id from recruiters where user_id = ${req.user.id} limit 1`;
    const recruiter = recruiters[0];

    const breakdown = await sql`
      select status, count(*) as count, sum(view_count) as total_views, sum(application_count) as total_applications
      from jobs
      where recruiter_id = ${recruiter.id}
      group by status
    `;

    const totalJobs = await sql`select count(*) from jobs where recruiter_id = ${recruiter.id}`;
    const activeJobs = await sql`select count(*) from jobs where recruiter_id = ${recruiter.id} and status = 'active'`;

    res.json({
      success: true,
      data: {
        totalJobs: parseInt(totalJobs[0].count),
        activeJobs: parseInt(activeJobs[0].count),
        breakdown: breakdown.map(b => toCamel(b))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
