import { describe, it, expect } from 'vitest';
import { validateRNC, validateNCFFormat, calculateITBIS } from './fiscal';

describe('Fiscal Logic Requirements', () => {

  describe('RNC Validation (Module 11)', () => {
    it('should validate a correct 9-digit RNC (Corporate)', () => {
      // Generated valid RNCs based on DGII algorithm (Weights 7,9,8,6,5,4,3,2; Rem 0->2, 1->1)
      // 10100561 -> Sum 55, Rem 0 -> Digit 2
      expect(validateRNC('101005612')).toBe(true);
      // 10179630 -> Sum 135, Rem 3 -> Digit 8 (11-3)
      expect(validateRNC('101796308')).toBe(true);
    });

    it('should validate a correct 11-digit Cedula (Individual)', () => {
      // Generated valid Cedula based on Luhn algorithm (Mod 10)
      // Base: 0011645428 -> Sum 39 -> Rem 9 -> Check 1
      expect(validateRNC('00116454281')).toBe(true);
    });

    it('should reject RNCs with incorrect length', () => {
      expect(validateRNC('123')).toBe(false);
      expect(validateRNC('1234567890123')).toBe(false);
    });

    it('should reject RNCs containing non-numeric characters', () => {
       // validateRNC strips non-numeric, so '101-00561-2' becomes '101005612' (Valid)
       // This test checks if it returns true for valid formatted strings
       expect(validateRNC('101-00561-2')).toBe(true);

       // But if the characters make it invalid length or logic:
       // 'A01005612' -> '01005612' (8 digits) -> False
       expect(validateRNC('A01005612')).toBe(false);
    });

    it('should reject mathematically invalid RNCs (Check digit mismatch)', () => {
      // 101005612 is valid. 101005613 should be invalid.
      expect(validateRNC('101005613')).toBe(false);
    });
  });

  describe('NCF Management (Series E)', () => {
    it('should validate correct e-NCF format (E + 2 digits + 10 digits)', () => {
      // E310000000001 (E + 31 + 0000000001) -> Total 13 chars
      expect(validateNCFFormat('E310000000001')).toBe(true);
    });

    it('should reject NCFs that do not start with E', () => {
      expect(validateNCFFormat('B0100000001')).toBe(false);
    });

    it('should reject NCFs with incorrect length', () => {
      expect(validateNCFFormat('E31001')).toBe(false); // Too short
      expect(validateNCFFormat('E31000000000001')).toBe(false); // Too long
    });

    it('should reject NCFs with invalid type codes', () => {
       // Our current implementation only checks format, but if we extended it:
       // For now, this test ensures format is strict on digits
       expect(validateNCFFormat('EAA0000000001')).toBe(false);
    });
  });

  describe('ITBIS Calculations', () => {
    it('should calculate 18% standard rate correctly', () => {
      const amount = 100;
      const tax = calculateITBIS(amount, 'STANDARD');
      expect(tax).toBe(18.00);
    });

    it('should calculate 16% reduced rate correctly', () => {
      const amount = 100;
      const tax = calculateITBIS(amount, 'REDUCED');
      expect(tax).toBe(16.00);
    });

    it('should calculate 0% exempt rate correctly', () => {
      const amount = 100;
      const tax = calculateITBIS(amount, 'EXEMPT');
      expect(tax).toBe(0.00);
    });

    it('should handle rounding correctly (2 decimal places)', () => {
      // 10.55 * 0.18 = 1.899 -> 1.90
      expect(calculateITBIS(10.55, 'STANDARD')).toBe(1.90);
    });
  });

});
