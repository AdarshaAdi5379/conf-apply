import { describe, it, expect, vi } from 'vitest';

function createMockNatural() {
  const analyzer = { getSentiment: vi.fn().mockReturnValue(3) };
  const tokenizer = { tokenize: vi.fn().mockReturnValue(['good', 'experience']) };
  const SentimentAnalyzer = function () {
    return analyzer;
  };
  const WordTokenizer = function () {
    return tokenizer;
  };
  return { SentimentAnalyzer, PorterStemmer: {}, WordTokenizer };
}

vi.mock('natural', () => ({
  default: createMockNatural(),
}));

vi.mock('../src/db.js', () => {
  const mockSql = async () => [{ count: 5, avg_sentiment: 60 }];
  mockSql.unsafe = async () => [];
  return { default: mockSql };
});

import trustScoreService from '../src/services/trustScoreService.js';

describe('TrustScoreService', () => {
  describe('calculateTrustScore', () => {
    it('should calculate max score correctly', () => {
      expect(trustScoreService.calculateTrustScore(100, true, 5, 100)).toBe(100);
    });

    it('should calculate min score correctly', () => {
      expect(trustScoreService.calculateTrustScore(0, false, 0, 0)).toBe(0);
    });

    it('should weight domain as 40% of score', () => {
      expect(trustScoreService.calculateTrustScore(50, false, 0, 0)).toBe(20);
    });

    it('should add 20 for verified LinkedIn', () => {
      expect(trustScoreService.calculateTrustScore(0, true, 0, 0) - trustScoreService.calculateTrustScore(0, false, 0, 0)).toBe(20);
    });

    it('should never exceed 100', () => {
      expect(trustScoreService.calculateTrustScore(100, true, 5, 100)).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeSentiment', () => {
    it('should return a number between -100 and 100', () => {
      const score = trustScoreService.analyzeSentiment('Great experience');
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(-100);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getTrustLevel', () => {
    it('should return high for score >= 70', () => {
      const result = trustScoreService.getTrustLevel(85);
      expect(result.level).toBe('high');
      expect(result.label).toBe('Highly Trusted');
    });

    it('should return medium for score 40-69', () => {
      expect(trustScoreService.getTrustLevel(55).level).toBe('medium');
    });

    it('should return low for score < 40', () => {
      expect(trustScoreService.getTrustLevel(20).level).toBe('low');
    });
  });

  describe('shouldFlag', () => {
    it('should flag when trust score is very low with multiple feedbacks', () => {
      expect(trustScoreService.shouldFlag(20, 5, 3, 50).shouldFlag).toBe(true);
    });

    it('should not flag with few feedbacks', () => {
      expect(trustScoreService.shouldFlag(20, 1, 3, 50).shouldFlag).toBe(false);
    });

    it('should not flag with good metrics', () => {
      const result = trustScoreService.shouldFlag(80, 5, 4.5, 80);
      expect(result.shouldFlag).toBe(false);
      expect(result.reasons).toEqual([]);
    });
  });

  describe('generateInsights', () => {
    it('should include trust level', () => {
      const insights = trustScoreService.generateInsights({
        trustScore: 85, verificationData: { clearbitVerified: true },
        verifiedLinkedIn: true, feedbackCount: 10, averageRating: 4.5, isFlagged: false,
      });
      expect(insights.some(i => i.includes('Trust Level'))).toBe(true);
    });
  });
});
