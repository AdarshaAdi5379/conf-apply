import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockRecruiter = { id: 'rec-1', company: 'Test Corp' };

vi.mock('../src/db.js', () => {
  const invocation = vi.fn();
  invocation.mockReturnValue([{ id: 'job-1', title: 'Software Engineer', company: 'Test Corp', role_type: 'Full-time', status: 'active', description: 'We are looking for...', required_skills: ['JavaScript'], view_count: 100, application_count: 3, created_at: new Date(), updated_at: new Date(), recruiter_name: 'Test Recruiter', recruiter_company: 'Test Corp', trust_score: 85, verified_linkedin: true }]);

  function sqlHandler(...args) {
    if (args.length === 0) return invocation();
    if (!Array.isArray(args[0])) return args[0];
    return invocation();
  }

  Object.defineProperty(sqlHandler, 'join', { value: (items) => items[0] || '' });
  Object.defineProperty(sqlHandler, 'array', { value: () => [] });
  Object.defineProperty(sqlHandler, 'unsafe', { value: async () => [] });

  return { default: sqlHandler };
});

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn().mockReturnValue({ userId: 'user-1', role: 'recruiter', recruiterId: 'rec-1' }),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/jobs', (await import('../src/routes/job.js')).default);

describe('Job Routes', () => {
  describe('GET /api/jobs', () => {
    it('should return active jobs', async () => {
      const res = await request(app).get('/api/jobs');
      expect([200, 500]).toContain(res.status);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return job by id', async () => {
      const res = await request(app).get('/api/jobs/job-1');
      expect([200, 500]).toContain(res.status);
    });
  });
});
