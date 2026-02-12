/**
 * @file Unit tests for the PrismaBrandRepository.
 *
 * Tests all 4 methods: findAll, findById, create, delete.
 * Each method is tested for success, edge cases, and DB error propagation.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaBrandRepository } from './prisma-brand.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed brand model methods. */
function createMockPrisma() {
    return {
        brand: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaBrandRepository', () => {
    let repository: PrismaBrandRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockBrand = { id: 'brand-123', refId: 1, name: 'Toyota' };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaBrandRepository);
    });

    // ── findAll ───────────────────────────────────────────────────────────

    describe('findAll()', () => {
        it('should return ok with data array and total count', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([mockBrand]);
            mockPrisma.brand.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([mockBrand]);
                expect(result.value.total).toBe(1);
            }
        });

        it('should return ok with empty data when no brands exist', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([]);
            mockPrisma.brand.count.mockResolvedValue(0);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([]);
                expect(result.value.total).toBe(0);
            }
        });

        it('should pass pagination params to Prisma when provided', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([]);
            mockPrisma.brand.count.mockResolvedValue(0);

            await repository.findAll({ skip: 10, take: 5 });

            expect(mockPrisma.brand.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 5 }),
            );
        });

        it('should not pass skip/take when no pagination params given', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([]);
            mockPrisma.brand.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.brand.findMany).toHaveBeenCalledWith({});
        });

        it('should call count in parallel with findMany', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([]);
            mockPrisma.brand.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.brand.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.brand.count).toHaveBeenCalledTimes(1);
        });

        it('should return err(DatabaseError) when findMany throws', async () => {
            mockPrisma.brand.findMany.mockRejectedValue(new Error('Connection refused'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find all brands');
            }
        });

        it('should return err(DatabaseError) when count throws', async () => {
            mockPrisma.brand.findMany.mockResolvedValue([]);
            mockPrisma.brand.count.mockRejectedValue(new Error('Timeout'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    // ── findById ──────────────────────────────────────────────────────────

    describe('findById()', () => {
        it('should return ok(brand) when brand exists', async () => {
            mockPrisma.brand.findUnique.mockResolvedValue(mockBrand);

            const result = await repository.findById('brand-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockBrand);
            }
            expect(mockPrisma.brand.findUnique).toHaveBeenCalledWith({
                where: { id: 'brand-123' },
            });
        });

        it('should return ok(null) when brand does not exist', async () => {
            mockPrisma.brand.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.brand.findUnique.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findById('brand-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find brand by id');
            }
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe('create()', () => {
        const createData = { name: 'Peugeot' };

        it('should return ok(brand) on successful creation', async () => {
            const createdBrand = { id: 'brand-456', refId: 2, name: 'Peugeot' };
            mockPrisma.brand.create.mockResolvedValue(createdBrand);

            const result = await repository.create(createData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(createdBrand);
                expect(result.value.name).toBe('Peugeot');
            }
        });

        it('should pass correct data to Prisma create', async () => {
            mockPrisma.brand.create.mockResolvedValue(mockBrand);

            await repository.create(createData);

            expect(mockPrisma.brand.create).toHaveBeenCalledWith({
                data: { name: 'Peugeot' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.brand.create.mockRejectedValue(new Error('Unique constraint violation'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create brand');
            }
        });
    });

    // ── delete ────────────────────────────────────────────────────────────

    describe('delete()', () => {
        it('should return ok(undefined) on successful deletion', async () => {
            mockPrisma.brand.delete.mockResolvedValue({});

            const result = await repository.delete('brand-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeUndefined();
            }
            expect(mockPrisma.brand.delete).toHaveBeenCalledWith({
                where: { id: 'brand-123' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.brand.delete.mockRejectedValue(new Error('FK constraint violation'));

            const result = await repository.delete('brand-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to delete brand');
            }
        });

        it('should return err(DatabaseError) when record not found for deletion', async () => {
            mockPrisma.brand.delete.mockRejectedValue(new Error('Record not found'));

            const result = await repository.delete('non-existent');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
