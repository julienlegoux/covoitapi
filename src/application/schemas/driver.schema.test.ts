/**
 * @file Unit tests for the driver schema validation.
 *
 * Tests the createDriverSchema Zod schema used to validate
 * driver registration input (driver license field).
 */

import { describe, expect, it } from 'vitest';
import { createDriverSchema } from './driver.schema.js';

describe('createDriverSchema', () => {
    it('should accept valid driver license', () => {
        const result = createDriverSchema.safeParse({ driverLicense: 'DL-123456' });
        expect(result.success).toBe(true);
    });

    it('should reject empty string for driverLicense', () => {
        const result = createDriverSchema.safeParse({ driverLicense: '' });
        expect(result.success).toBe(false);
    });

    it('should reject missing driverLicense field', () => {
        const result = createDriverSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('should reject non-string type for driverLicense', () => {
        const result = createDriverSchema.safeParse({ driverLicense: 12345 });
        expect(result.success).toBe(false);
    });

    it('should accept long driver license strings', () => {
        const result = createDriverSchema.safeParse({ driverLicense: 'AB-1234567890-XYZ' });
        expect(result.success).toBe(true);
    });

    it('should reject null driverLicense', () => {
        const result = createDriverSchema.safeParse({ driverLicense: null });
        expect(result.success).toBe(false);
    });
});
