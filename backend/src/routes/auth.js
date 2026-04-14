import express from 'express';
const router = express.Router();
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import sql from '../db.js';
import { auth } from '../middleware/auth.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('Missing JWT_SECRET (set it in Render environment variables)');
  }
  return secret;
}

function generateTokens(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    recruiterId: user.recruiterId
  };
  
  const jwtSecret = getJwtSecret();

  const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, jwtSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
  
  return { accessToken, refreshToken };
}

function mapAuthError(error) {
  const msg = String(error?.message || '');

  if (msg.includes('Missing JWT_SECRET')) {
    return { status: 500, error: 'Server misconfigured: missing JWT_SECRET' };
  }
  if (msg.includes('Missing DATABASE_URL')) {
    return { status: 500, error: 'Server misconfigured: missing DATABASE_URL' };
  }

  // Postgres: missing table / schema not applied
  if (error?.code === '42P01' || msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('does not exist')) {
    return { status: 500, error: 'Database schema not initialized (missing tables)' };
  }

  return { status: 500, error: 'Server error' };
}

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['candidate', 'recruiter', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user exists
    const existingUsers = await sql`select id from users where email = ${email} limit 1`;
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUsers = await sql`
      insert into users (name, email, password_hash, role)
      values (${name}, ${email}, ${passwordHash}, ${role || 'candidate'})
      returning id, name, email, role, created_at as "createdAt"
    `;
    const user = createdUsers[0];

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    const mapped = mapAuthError(error);
    res.status(mapped.status).json({ success: false, error: mapped.error });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const users = await sql`
      select id, name, email, role, password_hash as "passwordHash"
      from users
      where email = ${email}
      limit 1
    `;
    const user = users[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const mapped = mapAuthError(error);
    res.status(mapped.status).json({ success: false, error: mapped.error });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const users = await sql`
      select id, name, email, role, recruiter_id as "recruiterId", created_at as "createdAt"
      from users
      where id = ${req.user._id}
      limit 1
    `;
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { _id: user.id, ...user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      const users = await sql`
        select id, name, email, role, recruiter_id as "recruiterId"
        from users
        where id = ${decoded.userId}
        limit 1
      `;
      
      const user = users[0];
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
