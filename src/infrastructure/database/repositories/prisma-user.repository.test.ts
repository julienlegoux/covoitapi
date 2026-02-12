/**
 * @module prisma-user.repository.test
 * Unit tests for {@link PrismaUserRepository}.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaUserRepository } from './prisma-user.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed user and auth model methods. */
function createMockPrismaClient() {
	return {
		user: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		auth: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			count: vi.fn(),
		},
	};
}

// Tests for the PrismaUserRepository Prisma implementation
describe('PrismaUserRepository', () => {
	let repository: PrismaUserRepository;
	let mockPrisma: ReturnType<typeof createMockPrismaClient>;

	const mockUser = {
		id: 'user-123',
		refId: 1,
		authRefId: 1,
		firstName: 'John',
		lastName: 'Doe',
		phone: '+33612345678',
		anonymizedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		auth: { email: 'test@example.com' },
	};

	beforeEach(() => {
		container.clearInstances();
		mockPrisma = createMockPrismaClient();
		container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
		container.registerInstance(TOKENS.Logger, createMockLogger());
		repository = container.resolve(PrismaUserRepository);
	});

	// Verifies findById returns the correct Result variant for found, not-found, and error cases
	describe('findById()', () => {
		it('should return ok(user) when user exists', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await repository.findById('user-123');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual({ ...mockUser, email: 'test@example.com' });
			}
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-123' },
				include: { auth: { select: { email: true } } },
			});
		});

		it('should return ok(null) when user not found', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null);

			const result = await repository.findById('non-existent');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBeNull();
			}
		});

		it('should return err(DatabaseError) on Prisma error', async () => {
			mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection failed'));

			const result = await repository.findById('user-123');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(DatabaseError);
				expect(result.error.message).toBe('Failed to find user by id');
			}
		});
	});

	// Verifies create passes correct data to Prisma and wraps results/errors properly
	describe('create()', () => {
		const createData = {
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '+33698765432',
			authRefId: 1,
		};

		it('should return ok(user) on successful creation', async () => {
			const createdUser = { ...mockUser, firstName: 'Jane', lastName: 'Smith', phone: '+33698765432' };
			mockPrisma.user.create.mockResolvedValue(createdUser);

			const result = await repository.create(createData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.firstName).toBe('Jane');
			}
		});

		it('should pass correct data to Prisma create', async () => {
			mockPrisma.user.create.mockResolvedValue(mockUser);

			await repository.create(createData);

			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: {
					firstName: createData.firstName,
					lastName: createData.lastName,
					phone: createData.phone,
					authRefId: createData.authRefId,
				},
				include: { auth: { select: { email: true } } },
			});
		});

		it('should return err(DatabaseError) on Prisma error', async () => {
			mockPrisma.user.create.mockRejectedValue(new Error('Unique constraint violation'));

			const result = await repository.create(createData);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(DatabaseError);
				expect(result.error.message).toBe('Failed to create user');
			}
		});
	});
});
