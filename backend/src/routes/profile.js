import express from 'express';
const router = express.Router();
import { body, validationResult } from 'express-validator';
import sql from '../db.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
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

const mapProfileRow = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    summary: row.summary,
    location: row.location,
    portfolioUrl: row.portfolio_url,
    linkedInUrl: row.linkedin_url,
    githubUrl: row.github_url,
    resumeUrl: row.resume_url,
    resumeName: row.resume_name,
    skills: row.skills || [],
    education: row.education || [],
    experience: row.experience || [],
    availability: row.availability,
    preferredRoles: row.preferred_roles || [],
    expectedSalary: row.expected_salary,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'recruiter') {
      const recruiters = await sql`select * from recruiters where user_id = ${req.user.id} limit 1`;
      if (!recruiters[0]) return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
      return res.json({ success: true, data: recruiters[0], type: 'recruiter' });
    }

    const profiles = await sql`select * from candidate_profiles where user_id = ${req.user.id} limit 1`;
    res.json({
      success: true,
      data: mapProfileRow(profiles[0]),
      type: 'candidate'
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   POST /api/profile
// @desc    Create or update candidate profile
// @access  Private (Candidate only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ success: false, error: 'Only candidates can have a candidate profile' });
    }

    const {
      phone, summary, location, portfolioUrl, linkedInUrl, githubUrl,
      skills, education, experience, availability, preferredRoles, expectedSalary
    } = req.body;

    const existing = await sql`select id from candidate_profiles where user_id = ${req.user.id} limit 1`;

    let profile;
    if (existing[0]) {
      const updated = await sql`
        update candidate_profiles
        set
          phone = ${phone ?? null},
          summary = ${summary ?? null},
          location = ${location ?? null},
          portfolio_url = ${portfolioUrl ?? null},
          linkedin_url = ${linkedInUrl ?? null},
          github_url = ${githubUrl ?? null},
          skills = ${skills || []},
          education = ${JSON.stringify(education || [])},
          experience = ${JSON.stringify(experience || [])},
          availability = ${availability ?? null},
          preferred_roles = ${preferredRoles || []},
          expected_salary = ${JSON.stringify(expectedSalary || null)},
          updated_at = now()
        where user_id = ${req.user.id}
        returning *
      `;
      profile = updated[0];
    } else {
      const created = await sql`
        insert into candidate_profiles (
          user_id, phone, summary, location, portfolio_url, linkedin_url, github_url,
          skills, education, experience, availability, preferred_roles, expected_salary
        ) values (
          ${req.user.id}, ${phone ?? null}, ${summary ?? null}, ${location ?? null},
          ${portfolioUrl ?? null}, ${linkedInUrl ?? null}, ${githubUrl ?? null},
          ${skills || []}, ${JSON.stringify(education || [])}, ${JSON.stringify(experience || [])},
          ${availability ?? null}, ${preferredRoles || []}, ${JSON.stringify(expectedSalary || null)}
        )
        returning *
      `;
      profile = created[0];
    }

    res.json({
      success: true,
      data: mapProfileRow(profile),
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('POST /api/profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// @route   PUT /api/profile/resume
// @desc    Upload resume
// @access  Private (Candidate only)
router.put('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ success: false, error: 'Only candidates can upload a resume' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    const existing = await sql`select id from candidate_profiles where user_id = ${req.user.id} limit 1`;
    
    if (!existing[0]) {
      // Create empty profile if it doesn't exist
      await sql`insert into candidate_profiles (user_id) values (${req.user.id})`;
    }

    const updated = await sql`
      update candidate_profiles
      set
        resume_url = ${req.file.path},
        resume_name = ${req.file.originalname},
        updated_at = now()
      where user_id = ${req.user.id}
      returning *
    `;

    res.json({
      success: true,
      data: mapProfileRow(updated[0]),
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    console.error('PUT /api/profile/resume error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
