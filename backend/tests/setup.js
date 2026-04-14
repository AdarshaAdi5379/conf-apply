import { beforeAll, afterAll, vi } from 'vitest';

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

afterAll(() => {
  vi.restoreAllMocks();
});
