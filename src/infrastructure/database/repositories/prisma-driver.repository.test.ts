/**
 * @file Unit tests for the PrismaDriverRepository.
 *
 * Tests all 2 methods: findByUserRefId, create.
 * Each method is tested for success, edge cases, and DB error propagation.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaDriverRepository } from './prisma-driver.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed driver model methods. */
function createMockPrisma() {
    return {
        driver: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    };
}

describe('PrismaDriverRepository', () => {
    let repository: PrismaDriverRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockDriver = {
        id: 'driver-123',
        refId: 1,
        driverLicense: 'DL-2025-ABC-123',
        userRefId: 42,
        anonymizedAt: null,
    };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaDriverRepository);
    });

    // ── findByUserRefId ──────────────────────────────────────────────────

    describe('findByUserRefId()', () => {
        it('should return ok(driver) when driver with given userRefId exists', async () => {
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);

            const result = await repository.findByUserRefId(42);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockDriver);
                expect(result.value!.userRefId).toBe(42);
                expect(result.value!.driverLicense).toBe('DL-2025-ABC-123');
            }
            expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
                where: { userRefId: 42 },
            });
        });

        it('should return ok(null) when user has no driver record', async () => {
            mockPrisma.driver.findUnique.mockResolvedValue(null);

            const result = await repository.findByUserRefId(999);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should use findUnique since userRefId is a unique FK', async () => {
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);

            await repository.findByUserRefId(42);

            expect(mockPrisma.driver.findUnique).toHaveBeenCalledTimes(1);
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.driver.findUnique.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findByUserRefId(42);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find driver by user ref id');
            }
        });
    });

    // ── findByUserId ──────────────────────────────────────────────────────

    describe('findByUserId()', () => {
        it('should return ok(driver) when driver found via user UUID relation filter', async () => {
            mockPrisma.driver.findFirst.mockResolvedValue(mockDriver);

            const result = await repository.findByUserId('user-uuid-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockDriver);
            }
            expect(mockPrisma.driver.findFirst).toHaveBeenCalledWith({
                where: { user: { id: 'user-uuid-123' } },
            });
        });

        it('should return ok(null) when user has no driver record', async () => {
            mockPrisma.driver.findFirst.mockResolvedValue(null);

            const result = await repository.findByUserId('user-uuid-999');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.driver.findFirst.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findByUserId('user-uuid-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find driver by user id');
            }
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe('create()', () => {
        const createData = { driverLicense: 'DL-2025-XYZ-789', userRefId: 55 };

        it('should return ok(driver) on successful creation', async () => {
            const createdDriver = {
                id: 'driver-456',
                refId: 2,
                driverLicense: 'DL-2025-XYZ-789',
                userRefId: 55,
                anonymizedAt: null,
            };
            mockPrisma.driver.create.mockResolvedValue(createdDriver);

            const result = await repository.create(createData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(createdDriver);
                expect(result.value.driverLicense).toBe('DL-2025-XYZ-789');
                expect(result.value.userRefId).toBe(55);
                expect(result.value.anonymizedAt).toBeNull();
            }
        });

        it('should pass correct data to Prisma create', async () => {
            mockPrisma.driver.create.mockResolvedValue(mockDriver);

            await repository.create(createData);

            expect(mockPrisma.driver.create).toHaveBeenCalledWith({
                data: {
                    driverLicense: 'DL-2025-XYZ-789',
                    userRefId: 55,
                },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.driver.create.mockRejectedValue(new Error('FK constraint: user not found'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create driver');
            }
        });

        it('should return err(DatabaseError) on duplicate userRefId', async () => {
            mockPrisma.driver.create.mockRejectedValue(new Error('Unique constraint violation on userRefId'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
