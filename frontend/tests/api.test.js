import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn().mockReturnValue(mockAxiosInstance),
      isCancel: vi.fn().mockReturnValue(false),
    },
  };
});

describe('API Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should create axios instance with correct base URL', async () => {
    await import('../src/services/api');
    expect(axios.create).toHaveBeenCalled();
    const callArgs = axios.create.mock.calls[0][0];
    expect(callArgs.baseURL).toBe('http://localhost:5000');
    expect(callArgs.headers['Content-Type']).toBe('application/json');
  });

  it('should have all expected API modules', async () => {
    const apiModule = await import('../src/services/api');
    expect(apiModule.authAPI).toBeDefined();
    expect(apiModule.recruiterAPI).toBeDefined();
    expect(apiModule.feedbackAPI).toBeDefined();
    expect(apiModule.adminAPI).toBeDefined();
    expect(apiModule.jobAPI).toBeDefined();
    expect(apiModule.applicationAPI).toBeDefined();
    expect(apiModule.profileAPI).toBeDefined();
  });

  it('should have correct authAPI methods', async () => {
    const apiModule = await import('../src/services/api');
    expect(typeof apiModule.authAPI.login).toBe('function');
    expect(typeof apiModule.authAPI.register).toBe('function');
    expect(typeof apiModule.authAPI.getCurrentUser).toBe('function');
  });

  it('should have correct jobAPI methods', async () => {
    const apiModule = await import('../src/services/api');
    expect(typeof apiModule.jobAPI.getAll).toBe('function');
    expect(typeof apiModule.jobAPI.getById).toBe('function');
    expect(typeof apiModule.jobAPI.create).toBe('function');
    expect(typeof apiModule.jobAPI.update).toBe('function');
    expect(typeof apiModule.jobAPI.delete).toBe('function');
    expect(typeof apiModule.jobAPI.duplicate).toBe('function');
    expect(typeof apiModule.jobAPI.getMyJobs).toBe('function');
  });

  it('should have correct applicationAPI methods', async () => {
    const apiModule = await import('../src/services/api');
    expect(typeof apiModule.applicationAPI.submit).toBe('function');
    expect(typeof apiModule.applicationAPI.getMyApplications).toBe('function');
    expect(typeof apiModule.applicationAPI.getJobApplications).toBe('function');
    expect(typeof apiModule.applicationAPI.updateStatus).toBe('function');
    expect(typeof apiModule.applicationAPI.withdraw).toBe('function');
  });
});
