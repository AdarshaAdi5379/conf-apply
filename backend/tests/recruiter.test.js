import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

const mockRecruiters = [
  {
    id: 'rec-1', user_id: null, name: 'Test Recruiter', email: 'test@recruiter.com',
    company: 'Test Corp', linkedin_url: 'https://linkedin.com/in/test',
    company_website: 'https://testcorp.com', position: 'HR Manager',
    domain_score: 80, verified_linkedin: true, trust_score: 85,
    feedback_count: 10, average_rating: 4.5, sentiment_score: 75,
    is_verified: true, is_flagged: false, flagged_reasons: [],
    verification_data: { clearbitVerified: true, hunterVerified: true, safeBrowsingPassed: true },
    metadata: {}, profile_views: 50,
    created_at: new Date(), updated_at: new Date(),
  },
];

vi.mock('../src/db.js', () => {
  const mockSql = async (strings, ...values) => {
    const query = strings.join('?');

    if (query.includes('from recruiters where id')) {
      return values.some(v => String(v) === 'nonexistent') ? [] : [mockRecruiters[0]];
    }

    if (query.includes('from feedback f')) {
      return [];
    }

    if (query.includes('update recruiters')) {
      mockRecruiters[0].profile_views = (mockRecruiters[0].profile_views || 0) + 1;
      return mockRecruiters;
    }

    if (query.includes('ilike')) {
      return [];
    }

    if (query.includes('from recruiters')) {
      return mockRecruiters;
    }

    return [];
  };
  mockSql.unsafe = async () => [];
  mockSql.array = () => [];
  return { default: mockSql };
});

vi.mock('../src/services/clearbitService.js', () => ({
  default: {
    verifyCompanyDomain: vi.fn().mockResolvedValue({ verified: true, score: 80, data: { name: 'Test Corp' } }),
  },
}));

vi.mock('../src/services/hunterService.js', () => ({
  default: {
    verifyEmail: vi.fn().mockResolvedValue({ verified: true, score: 90, status: 'valid', isDisposable: false }),
  },
}));

vi.mock('../src/services/safeBrowsingService.js', () => ({
  default: {
    checkUrl: vi.fn().mockResolvedValue({ safe: true, score: 100 }),
  },
}));

vi.mock('../src/services/trustScoreService.js', () => ({
  default: {
    calculateTrustScore: vi.fn().mockReturnValue(85),
    getTrustLevel: vi.fn().mockReturnValue({ level: 'high', color: 'green', label: 'Highly Trusted' }),
    generateInsights: vi.fn().mockReturnValue(['Trust Level: Highly Trusted', 'Company domain verified']),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/recruiter', (await import('../src/routes/recruiter.js')).default);

describe('Recruiter Routes', () => {
  describe('POST /api/recruiter/verify', () => {
    it('should verify recruiter with valid data', async () => {
      const res = await request(app)
        .post('/api/recruiter/verify')
        .send({ name: 'New Recruiter', email: 'new@company.com', company: 'New Corp', linkedInUrl: 'https://linkedin.com/in/new' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject verification with missing name', async () => {
      const res = await request(app)
        .post('/api/recruiter/verify')
        .send({ email: 'test@company.com', company: 'Test Corp' });

      expect(res.status).toBe(400);
    });

    it('should reject verification with invalid email', async () => {
      const res = await request(app)
        .post('/api/recruiter/verify')
        .send({ name: 'Test', email: 'invalid', company: 'Test Corp' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/recruiter/list/leaderboard', () => {
    it('should return leaderboard', async () => {
      const res = await request(app).get('/api/recruiter/list/leaderboard');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/recruiter/:id', () => {
    it('should return recruiter by id', async () => {
      const res = await request(app).get('/api/recruiter/rec-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recruiter._id).toBe('rec-1');
    });

    it('should return 404 for non-existent recruiter', async () => {
      const res = await request(app).get('/api/recruiter/nonexistent');
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid recruiter id', async () => {
      const res = await request(app).get('/api/recruiter/undefined');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid recruiter ID');
    });
  });
});
