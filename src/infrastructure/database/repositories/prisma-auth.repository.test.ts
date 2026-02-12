/**
 * @file Unit tests for the PrismaAuthRepository.
 *
 * Tests all 4 methods: findByEmail, createWithUser (transactional),
 * existsByEmail, and updateRole. Each method is tested for success
 * and DB error propagation using a mock PrismaClient.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaAuthRepository } from './prisma-auth.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

function createMockPrisma() {
    const txAuth = { create: vi.fn() };
    const txUser = { create: vi.fn() };
    return {
        auth: {
            findUnique: vi.fn(),
            count: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
            fn({ auth: txAuth, user: txUser }),
        ),
        _txAuth: txAuth,
        _txUser: txUser,
    };
}

describe('PrismaAuthRepository', () => {
    let repository: PrismaAuthRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaAuthRepository);
    });

    describe('findByEmail()', () => {
        it('should return ok(auth) when auth exists', async () => {
            const mockAuth = { id: 'auth-1', refId: 1, email: 'test@example.com', password: 'hashed', role: 'USER' };
            mockPrisma.auth.findUnique.mockResolvedValue(mockAuth);

            const result = await repository.findByEmail('test@example.com');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockAuth);
            }
            expect(mockPrisma.auth.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        });

        it('should return ok(null) when auth not found', async () => {
            mockPrisma.auth.findUnique.mockResolvedValue(null);

            const result = await repository.findByEmail('unknown@example.com');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.auth.findUnique.mockRejectedValue(new Error('Connection failed'));

            const result = await repository.findByEmail('test@example.com');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find auth by email');
            }
        });
    });

    describe('createWithUser()', () => {
        const authData = { email: 'new@example.com', password: 'hashed-pw' };
        const userData = { firstName: null, lastName: null, phone: null };

        it('should return ok({ auth, user }) on successful transaction', async () => {
            const mockAuth = { id: 'auth-1', refId: 1, email: 'new@example.com', password: 'hashed-pw', role: 'USER' };
            const mockUser = { id: 'user-1', refId: 1, authRefId: 1, firstName: null, lastName: null, phone: null };
            mockPrisma._txAuth.create.mockResolvedValue(mockAuth);
            mockPrisma._txUser.create.mockResolvedValue(mockUser);

            const result = await repository.createWithUser(authData, userData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.auth).toEqual(mockAuth);
                expect(result.value.user.email).toBe('new@example.com');
            }
        });

        it('should return err(DatabaseError) when transaction fails', async () => {
            mockPrisma.$transaction.mockRejectedValue(new Error('Transaction rollback'));

            const result = await repository.createWithUser(authData, userData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create auth with user');
            }
        });
    });

    describe('existsByEmail()', () => {
        it('should return ok(true) when email exists', async () => {
            mockPrisma.auth.count.mockResolvedValue(1);

            const result = await repository.existsByEmail('taken@example.com');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(true);
            }
            expect(mockPrisma.auth.count).toHaveBeenCalledWith({ where: { email: 'taken@example.com' } });
        });

        it('should return ok(false) when email does not exist', async () => {
            mockPrisma.auth.count.mockResolvedValue(0);

            const result = await repository.existsByEmail('free@example.com');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(false);
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.auth.count.mockRejectedValue(new Error('DB down'));

            const result = await repository.existsByEmail('test@example.com');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('updateRole()', () => {
        it('should return ok(undefined) on successful update', async () => {
            mockPrisma.auth.update.mockResolvedValue({});

            const result = await repository.updateRole(1, 'ADMIN');

            expect(result.success).toBe(true);
            expect(mockPrisma.auth.update).toHaveBeenCalledWith({
                where: { refId: 1 },
                data: { role: 'ADMIN' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.auth.update.mockRejectedValue(new Error('Update failed'));

            const result = await repository.updateRole(1, 'ADMIN');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to update auth role');
            }
        });
    });
});
