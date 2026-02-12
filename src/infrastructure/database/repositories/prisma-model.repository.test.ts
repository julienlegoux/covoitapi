/**
 * @file Unit tests for the PrismaModelRepository.
 *
 * Tests all 4 methods: findAll, findById, findByNameAndBrand, create.
 * Each method is tested for success, edge cases, and DB error propagation.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaModelRepository } from './prisma-model.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed model methods. */
function createMockPrisma() {
    return {
        model: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
        },
    };
}

describe('PrismaModelRepository', () => {
    let repository: PrismaModelRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockModel = { id: 'model-123', refId: 1, name: 'Clio', brandRefId: 5 };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaModelRepository);
    });

    // ── findAll ───────────────────────────────────────────────────────────

    describe('findAll()', () => {
        it('should return ok(models) with all model records', async () => {
            const models = [
                mockModel,
                { id: 'model-456', refId: 2, name: 'Golf', brandRefId: 3 },
            ];
            mockPrisma.model.findMany.mockResolvedValue(models);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(models);
                expect(result.value).toHaveLength(2);
            }
        });

        it('should return ok with empty array when no models exist', async () => {
            mockPrisma.model.findMany.mockResolvedValue([]);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual([]);
            }
        });

        it('should call Prisma findMany with no arguments', async () => {
            mockPrisma.model.findMany.mockResolvedValue([]);

            await repository.findAll();

            expect(mockPrisma.model.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.model.findMany).toHaveBeenCalledWith();
        });

        it('should return err(DatabaseError) when findMany throws', async () => {
            mockPrisma.model.findMany.mockRejectedValue(new Error('Connection refused'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find all models');
            }
        });
    });

    // ── findById ──────────────────────────────────────────────────────────

    describe('findById()', () => {
        it('should return ok(model) when model exists', async () => {
            mockPrisma.model.findUnique.mockResolvedValue(mockModel);

            const result = await repository.findById('model-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockModel);
            }
            expect(mockPrisma.model.findUnique).toHaveBeenCalledWith({
                where: { id: 'model-123' },
            });
        });

        it('should return ok(null) when model does not exist', async () => {
            mockPrisma.model.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.model.findUnique.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findById('model-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find model by id');
            }
        });
    });

    // ── findByNameAndBrand ────────────────────────────────────────────────

    describe('findByNameAndBrand()', () => {
        it('should return ok(model) when model with name+brand combo exists', async () => {
            mockPrisma.model.findFirst.mockResolvedValue(mockModel);

            const result = await repository.findByNameAndBrand('Clio', 5);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockModel);
                expect(result.value!.name).toBe('Clio');
                expect(result.value!.brandRefId).toBe(5);
            }
            expect(mockPrisma.model.findFirst).toHaveBeenCalledWith({
                where: { name: 'Clio', brandRefId: 5 },
            });
        });

        it('should return ok(null) when no model matches name+brand combo', async () => {
            mockPrisma.model.findFirst.mockResolvedValue(null);

            const result = await repository.findByNameAndBrand('NonExistent', 999);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should use findFirst since (name, brandRefId) may not be a DB-level unique constraint', async () => {
            mockPrisma.model.findFirst.mockResolvedValue(mockModel);

            await repository.findByNameAndBrand('Clio', 5);

            expect(mockPrisma.model.findFirst).toHaveBeenCalledTimes(1);
            expect(mockPrisma.model.findUnique).not.toHaveBeenCalled();
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.model.findFirst.mockRejectedValue(new Error('Query timeout'));

            const result = await repository.findByNameAndBrand('Clio', 5);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find model by name and brand');
            }
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe('create()', () => {
        const createData = { name: '308', brandRefId: 7 };

        it('should return ok(model) on successful creation', async () => {
            const createdModel = { id: 'model-789', refId: 3, name: '308', brandRefId: 7 };
            mockPrisma.model.create.mockResolvedValue(createdModel);

            const result = await repository.create(createData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(createdModel);
                expect(result.value.name).toBe('308');
                expect(result.value.brandRefId).toBe(7);
            }
        });

        it('should pass correct data to Prisma create', async () => {
            mockPrisma.model.create.mockResolvedValue(mockModel);

            await repository.create(createData);

            expect(mockPrisma.model.create).toHaveBeenCalledWith({
                data: { name: '308', brandRefId: 7 },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.model.create.mockRejectedValue(new Error('FK constraint: brand not found'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create model');
            }
        });

        it('should return err(DatabaseError) on duplicate name+brand', async () => {
            mockPrisma.model.create.mockRejectedValue(new Error('Unique constraint violation'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
