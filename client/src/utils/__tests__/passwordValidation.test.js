import { validatePassword, getPasswordErrors, getPasswordStrength } from '../passwordValidation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    test('should validate a strong password', () => {
      const result = validatePassword('MyStr0ng!Pass');
      expect(result.isValid).toBe(true);
      expect(result.requirements.length).toBe(true);
      expect(result.requirements.lowercase).toBe(true);
      expect(result.requirements.uppercase).toBe(true);
      expect(result.requirements.number).toBe(true);
      expect(result.requirements.special).toBe(true);
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        '123', // too short
        'password', // no uppercase, number, special
        'PASSWORD', // no lowercase, number, special
        'Password', // no number, special
        'Password1', // no special
        'Password!', // no number
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
      });
    });

    test('should accept minimum requirements', () => {
      const result = validatePassword('Aa1!');
      expect(result.isValid).toBe(false); // Too short
      
      const result2 = validatePassword('Aa1!aa');
      expect(result2.isValid).toBe(true);
    });
  });

  describe('getPasswordErrors', () => {
    test('should return all missing requirements', () => {
      const errors = getPasswordErrors({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        special: false
      });
      
      expect(errors).toHaveLength(5);
      expect(errors).toContain('Password must be at least 6 characters long');
      expect(errors).toContain('Password must contain at least one lowercase letter (a-z)');
      expect(errors).toContain('Password must contain at least one uppercase letter (A-Z)');
      expect(errors).toContain('Password must contain at least one number (0-9)');
      expect(errors).toContain('Password must contain at least one special character (!@#$%^&*)');
    });
  });

  describe('getPasswordStrength', () => {
    test('should calculate strength correctly', () => {
      const weak = getPasswordStrength('123');
      expect(weak.score).toBe(1);
      expect(weak.label).toBe('Weak');

      const strong = getPasswordStrength('MyStr0ng!Pass');
      expect(strong.score).toBe(5);
      expect(strong.label).toBe('Strong');
      expect(strong.isValid).toBe(true);
    });

    test('should handle empty password', () => {
      const result = getPasswordStrength('');
      expect(result.score).toBe(0);
      expect(result.label).toBe('');
    });
  });
});
