import { describe, it, expect } from 'vitest';
import { getTrustLevel, formatDate, formatRelativeTime, getRecruiterId } from '../src/utils/helpers.js';

describe('Helpers', () => {
  describe('getTrustLevel', () => {
    it('should return high trust for score >= 70', () => {
      const result = getTrustLevel(85);
      expect(result.level).toBe('high');
      expect(result.textColor).toContain('green');
    });

    it('should return medium trust for score 40-69', () => {
      const result = getTrustLevel(60);
      expect(result.level).toBe('medium');
      expect(result.textColor).toContain('yellow');
    });

    it('should return low trust for score < 40', () => {
      const result = getTrustLevel(30);
      expect(result.level).toBe('low');
      expect(result.textColor).toContain('red');
    });

    it('should handle edge cases', () => {
      expect(getTrustLevel(0).level).toBe('low');
      expect(getTrustLevel(100).level).toBe('high');
      expect(getTrustLevel(70).level).toBe('high');
      expect(getTrustLevel(40).level).toBe('medium');
      expect(getTrustLevel(39).level).toBe('low');
    });
  });

  describe('formatDate', () => {
    it('should format a valid date', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return Today for current date', () => {
      const result = formatRelativeTime(new Date().toISOString());
      expect(result).toBe('Today');
    });
  });

  describe('getRecruiterId', () => {
    it('should prefer _id over id', () => {
      expect(getRecruiterId({ _id: 'rec-1', id: 'rec-2' })).toBe('rec-1');
    });

    it('should fall back to id', () => {
      expect(getRecruiterId({ id: 'rec-2' })).toBe('rec-2');
    });

    it('should reject undefined-like values', () => {
      expect(getRecruiterId('undefined')).toBeNull();
      expect(getRecruiterId({ id: 'null' })).toBeNull();
      expect(getRecruiterId(null)).toBeNull();
    });
  });
});
