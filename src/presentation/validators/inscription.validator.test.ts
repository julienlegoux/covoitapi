import { describe, it, expect } from 'vitest';
import { createInscriptionSchema } from './inscription.validator.js';

describe('createInscriptionSchema', () => {
	const validInput = { idpers: 'user-1', idtrajet: 'route-1' };

	it('should accept valid inscription input', () => {
		const result = createInscriptionSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing idpers', () => {
		const result = createInscriptionSchema.safeParse({ idtrajet: 'route-1' });
		expect(result.success).toBe(false);
	});

	it('should reject empty idpers', () => {
		const result = createInscriptionSchema.safeParse({ ...validInput, idpers: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing idtrajet', () => {
		const result = createInscriptionSchema.safeParse({ idpers: 'user-1' });
		expect(result.success).toBe(false);
	});

	it('should reject empty idtrajet', () => {
		const result = createInscriptionSchema.safeParse({ ...validInput, idtrajet: '' });
		expect(result.success).toBe(false);
	});
});
