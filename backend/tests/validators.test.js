import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateUrl,
  validatePhoneNumber,
  validateDate,
  validatePositiveNumber,
  sanitizeInput,
  sanitizeObject,
  validatePasswordDetailed,
} from '../src/utils/validators.js';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.org')).toBe(true);
      expect(validateEmail('a+b@sub.domain.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(123)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('Password1')).toBe(true);
      expect(validatePassword('Str0ngP@ss')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('PASSWORD')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('Pass1')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://www.domain.org/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl(null)).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('abc')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber(null)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate(new Date())).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('')).toBe(false);
      expect(validateDate(null)).toBe(false);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(validatePositiveNumber(0)).toBe(true);
      expect(validatePositiveNumber(42)).toBe(true);
      expect(validatePositiveNumber('42')).toBe(true);
    });

    it('should reject negative or invalid values', () => {
      expect(validatePositiveNumber(-1)).toBe(false);
      expect(validatePositiveNumber('abc')).toBe(false);
      expect(validatePositiveNumber(null)).toBe(false);
      expect(validatePositiveNumber(undefined)).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(sanitizeInput("Hello 'world'")).toBe('Hello &#x27;world&#x27;');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should return non-strings unchanged', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize specified fields', () => {
      const obj = { name: '<script>evil</script>', age: 25, bio: 'Normal text' };
      const result = sanitizeObject(obj, ['name', 'bio']);
      expect(result.name).toBe('&lt;script&gt;evil&lt;/script&gt;');
      expect(result.age).toBe(25);
      expect(result.bio).toBe('Normal text');
    });
  });

  describe('validatePasswordDetailed', () => {
    it('should return valid for strong passwords', () => {
      const result = validatePasswordDetailed('Password1');
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return specific errors for weak passwords', () => {
      const result = validatePasswordDetailed('short');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing uppercase', () => {
      const result = validatePasswordDetailed('password1');
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should detect missing lowercase', () => {
      const result = validatePasswordDetailed('PASSWORD1');
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    it('should detect missing number', () => {
      const result = validatePasswordDetailed('Password');
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });
  });
});
