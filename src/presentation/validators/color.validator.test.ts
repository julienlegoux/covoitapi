import { describe, it, expect } from 'vitest';
import { createColorSchema, updateColorSchema } from './color.validator.js';

describe('createColorSchema', () => {
	it('should accept valid color with name and hex', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: '#FF0000' });
		expect(result.success).toBe(true);
	});

	it('should accept lowercase hex', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: '#ff0000' });
		expect(result.success).toBe(true);
	});

	it('should accept mixed case hex', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: '#Ff00aB' });
		expect(result.success).toBe(true);
	});

	it('should reject missing name field', () => {
		const result = createColorSchema.safeParse({ hex: '#FF0000' });
		expect(result.success).toBe(false);
	});

	it('should reject empty name string', () => {
		const result = createColorSchema.safeParse({ name: '', hex: '#FF0000' });
		expect(result.success).toBe(false);
	});

	it('should reject missing hex field', () => {
		const result = createColorSchema.safeParse({ name: 'Red' });
		expect(result.success).toBe(false);
	});

	it('should reject hex without # prefix', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: 'FF0000' });
		expect(result.success).toBe(false);
	});

	it('should reject hex with wrong length', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: '#FFF' });
		expect(result.success).toBe(false);
	});

	it('should reject hex with invalid characters', () => {
		const result = createColorSchema.safeParse({ name: 'Red', hex: '#GGGGGG' });
		expect(result.success).toBe(false);
	});

	it('should reject non-string name', () => {
		const result = createColorSchema.safeParse({ name: 123, hex: '#FF0000' });
		expect(result.success).toBe(false);
	});
});

describe('updateColorSchema', () => {
	it('should accept valid name only', () => {
		const result = updateColorSchema.safeParse({ name: 'Dark Red' });
		expect(result.success).toBe(true);
	});

	it('should accept valid hex only', () => {
		const result = updateColorSchema.safeParse({ hex: '#CC0000' });
		expect(result.success).toBe(true);
	});

	it('should accept both name and hex', () => {
		const result = updateColorSchema.safeParse({ name: 'Dark Red', hex: '#CC0000' });
		expect(result.success).toBe(true);
	});

	it('should accept empty object (no fields)', () => {
		const result = updateColorSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should reject empty name string', () => {
		const result = updateColorSchema.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});

	it('should reject invalid hex format', () => {
		const result = updateColorSchema.safeParse({ hex: 'invalid' });
		expect(result.success).toBe(false);
	});

	it('should reject hex with wrong length', () => {
		const result = updateColorSchema.safeParse({ hex: '#FFF' });
		expect(result.success).toBe(false);
	});
});
