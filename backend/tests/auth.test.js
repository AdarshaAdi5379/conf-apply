import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.js';

vi.mock('../src/db.js', () => {
  const mockUsers = [
    { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'candidate', passwordHash: '$2b$10$EIXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
  ];

  const mockSql = async (strings, ...values) => {
    const query = strings.join('?');

    if (query.includes('insert into users')) {
      const newUser = { id: 'new-user-1', name: values[0], email: values[1], role: values[3] || 'candidate' };
      mockUsers.push({ ...newUser, passwordHash: 'hashed' });
      return [{ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, createdAt: new Date() }];
    }

    if (query.includes('select id from users where email')) {
      const email = values[0];
      const found = mockUsers.find(u => u.email === email);
      return found ? [{ id: found.id }] : [];
    }

    if (query.includes('select id, name, email, role, password_hash')) {
      const email = values[0];
      const found = mockUsers.find(u => u.email === email);
      return found ? [{ ...found, passwordHash: found.passwordHash }] : [];
    }

    if (query.includes('select id, name, email, role, recruiter_id')) {
      return [{ id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'candidate', recruiterId: null, createdAt: new Date() }];
    }

    return [];
  };
  mockSql.unsafe = async () => [];
  return { default: mockSql };
});

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2b$10$hashedpassword'),
    compare: vi.fn().mockImplementation((password, hash) => {
      return Promise.resolve(password === 'password123');
    }),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ userId: 'user-1' }),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock-jwt-token');
      expect(res.body.data.user.name).toBe('New User');
      expect(res.body.data.user.email).toBe('new@example.com');
      expect(res.body.data.user.role).toBe('candidate');
    });

    it('should reject registration with missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'invalid-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('User already exists with this email');
    });

    it('should accept custom role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Recruiter', email: 'recruiter@example.com', password: 'password123', role: 'recruiter' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('recruiter');
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'User', email: 'user@example.com', password: 'password123', role: 'superadmin' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('mock-jwt-token');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
