import { isNumberOrEmail, toRupiah, formatNumberPhone } from '../Helper';

describe('Helper Functions', () => {
  describe('isNumberOrEmail', () => {
    it('should return "phone" for strings containing only digits', () => {
      expect(isNumberOrEmail('081234567890')).toBe('phone');
      expect(isNumberOrEmail('123')).toBe('phone');
    });

    it('should return "email" for strings containing non-digits (like an email)', () => {
      expect(isNumberOrEmail('test@example.com')).toBe('email');
      expect(isNumberOrEmail('johndoe')).toBe('email'); // it defaults to email if not pure digits
    });
  });

  describe('toRupiah', () => {
    it('should format a valid number into Rupiah currency', () => {
      // Node's Intl implementation can sometimes use different spaces or output "Rp 5.000" vs "Rp5.000"
      // We check if it contains the formatted number instead of exact string to avoid environment issues.
      const formatted = toRupiah(5000);
      expect(formatted).toMatch(/Rp/);
      expect(formatted).toMatch(/5\.000/);
    });

    it('should handle strings that can be parsed as numbers', () => {
      const formatted = toRupiah('15000');
      expect(formatted).toMatch(/15\.000/);
    });

    it('should return Rp 0 for invalid numbers, null, or undefined', () => {
      expect(toRupiah(null)).toMatch(/0/);
      expect(toRupiah(undefined)).toMatch(/0/);
      expect(toRupiah('invalid')).toMatch(/0/);
    });
  });

  describe('formatNumberPhone', () => {
    it('should change starting 0 to +62', () => {
      expect(formatNumberPhone('081234567890')).toBe('+6281234567890');
    });

    it('should add +62 if not present', () => {
      expect(formatNumberPhone('81234567890')).toBe('+6281234567890');
    });

    it('should not modify a phone number that already starts with +62', () => {
      expect(formatNumberPhone('+6281234567890')).toBe('+6281234567890');
    });

    it('should handle empty values', () => {
      expect(formatNumberPhone(null)).toBe('');
      expect(formatNumberPhone('')).toBe('');
    });
  });
});
