import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaUserRepository } from './prisma-user.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../errors/repository.errors.js';

function createMockPrismaClient() {
	return {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
			count: vi.fn(),
		},
	};
}

describe('PrismaUserRepository', () => {
	let repository: PrismaUserRepository;
	let mockPrisma: ReturnType<typeof createMockPrismaClient>;

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		password: 'hashed-password',
		firstName: 'John',
		lastName: 'Doe',
		phone: '+33612345678',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		container.clearInstances();
		mockPrisma = createMockPrismaClient();
		container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
		repository = container.resolve(PrismaUserRepository);
	});

	describe('findById()', () => {
		it('should return ok(user) when user exists', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await repository.findById('user-123');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual(mockUser);
			}
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-123' },
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

	describe('findByEmail()', () => {
		it('should return ok(user) when user exists', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(mockUser);

			const result = await repository.findByEmail('test@example.com');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual(mockUser);
			}
			expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			});
		});

		it('should return ok(null) when user not found', async () => {
			mockPrisma.user.findUnique.mockResolvedValue(null);

			const result = await repository.findByEmail('nonexistent@example.com');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBeNull();
			}
		});

		it('should return err(DatabaseError) on Prisma error', async () => {
			mockPrisma.user.findUnique.mockRejectedValue(new Error('Query failed'));

			const result = await repository.findByEmail('test@example.com');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(DatabaseError);
				expect(result.error.message).toBe('Failed to find user by email');
			}
		});
	});

	describe('create()', () => {
		const createData = {
			email: 'new@example.com',
			password: 'hashed-password',
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '+33698765432',
		};

		it('should return ok(user) on successful creation', async () => {
			const createdUser = { ...mockUser, ...createData, id: 'new-user-id' };
			mockPrisma.user.create.mockResolvedValue(createdUser);

			const result = await repository.create(createData);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.email).toBe('new@example.com');
				expect(result.value.firstName).toBe('Jane');
			}
		});

		it('should pass correct data to Prisma create', async () => {
			mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...createData });

			await repository.create(createData);

			expect(mockPrisma.user.create).toHaveBeenCalledWith({
				data: {
					email: createData.email,
					password: createData.password,
					firstName: createData.firstName,
					lastName: createData.lastName,
					phone: createData.phone,
				},
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

	describe('existsByEmail()', () => {
		it('should return ok(true) when user exists', async () => {
			mockPrisma.user.count.mockResolvedValue(1);

			const result = await repository.existsByEmail('test@example.com');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(true);
			}
			expect(mockPrisma.user.count).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			});
		});

		it('should return ok(false) when user does not exist', async () => {
			mockPrisma.user.count.mockResolvedValue(0);

			const result = await repository.existsByEmail('nonexistent@example.com');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe(false);
			}
		});

		it('should return err(DatabaseError) on Prisma error', async () => {
			mockPrisma.user.count.mockRejectedValue(new Error('Database unavailable'));

			const result = await repository.existsByEmail('test@example.com');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(DatabaseError);
				expect(result.error.message).toBe('Failed to check if user exists');
			}
		});
	});
});
