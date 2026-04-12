import { beforeAll, afterAll, vi } from 'vitest';

// Mock the postgres client for all tests
vi.mock('./src/db.js', () => {
  const mockSql = async (strings, ...values) => {
    return [];
  };
  mockSql.unsafe = async () => [];
  return { default: mockSql };
});

beforeAll(() => {
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

afterAll(() => {
  vi.restoreAllMocks();
});
