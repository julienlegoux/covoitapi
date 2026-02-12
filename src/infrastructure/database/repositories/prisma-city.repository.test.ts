/**
 * @file Unit tests for the PrismaCityRepository.
 *
 * Tests all 5 methods: findAll, findById, findByCityName, create, delete.
 * Each method is tested for success, edge cases, and DB error propagation.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaCityRepository } from './prisma-city.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed city model methods. */
function createMockPrisma() {
    return {
        city: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaCityRepository', () => {
    let repository: PrismaCityRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockCity = { id: 'city-123', refId: 1, cityName: 'Paris', zipcode: '75000' };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaCityRepository);
    });

    // ── findAll ───────────────────────────────────────────────────────────

    describe('findAll()', () => {
        it('should return ok with data array and total count', async () => {
            mockPrisma.city.findMany.mockResolvedValue([mockCity]);
            mockPrisma.city.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([mockCity]);
                expect(result.value.total).toBe(1);
            }
        });

        it('should return ok with empty data when no cities exist', async () => {
            mockPrisma.city.findMany.mockResolvedValue([]);
            mockPrisma.city.count.mockResolvedValue(0);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([]);
                expect(result.value.total).toBe(0);
            }
        });

        it('should pass pagination params to Prisma when provided', async () => {
            mockPrisma.city.findMany.mockResolvedValue([]);
            mockPrisma.city.count.mockResolvedValue(0);

            await repository.findAll({ skip: 5, take: 10 });

            expect(mockPrisma.city.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 5, take: 10 }),
            );
        });

        it('should not pass skip/take when no pagination params given', async () => {
            mockPrisma.city.findMany.mockResolvedValue([]);
            mockPrisma.city.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.city.findMany).toHaveBeenCalledWith({});
        });

        it('should call count in parallel with findMany', async () => {
            mockPrisma.city.findMany.mockResolvedValue([]);
            mockPrisma.city.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.city.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.city.count).toHaveBeenCalledTimes(1);
        });

        it('should return err(DatabaseError) when findMany throws', async () => {
            mockPrisma.city.findMany.mockRejectedValue(new Error('Connection refused'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find all cities');
            }
        });

        it('should return err(DatabaseError) when count throws', async () => {
            mockPrisma.city.findMany.mockResolvedValue([]);
            mockPrisma.city.count.mockRejectedValue(new Error('Timeout'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    // ── findById ──────────────────────────────────────────────────────────

    describe('findById()', () => {
        it('should return ok(city) when city exists', async () => {
            mockPrisma.city.findUnique.mockResolvedValue(mockCity);

            const result = await repository.findById('city-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockCity);
            }
            expect(mockPrisma.city.findUnique).toHaveBeenCalledWith({
                where: { id: 'city-123' },
            });
        });

        it('should return ok(null) when city does not exist', async () => {
            mockPrisma.city.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.city.findUnique.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findById('city-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find city by id');
            }
        });
    });

    // ── findByCityName ────────────────────────────────────────────────────

    describe('findByCityName()', () => {
        it('should return ok(city) when city with given name exists', async () => {
            mockPrisma.city.findFirst.mockResolvedValue(mockCity);

            const result = await repository.findByCityName('Paris');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockCity);
                expect(result.value!.cityName).toBe('Paris');
            }
            expect(mockPrisma.city.findFirst).toHaveBeenCalledWith({
                where: { cityName: 'Paris' },
            });
        });

        it('should return ok(null) when no city with given name exists', async () => {
            mockPrisma.city.findFirst.mockResolvedValue(null);

            const result = await repository.findByCityName('Atlantis');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should use findFirst since cityName may not be unique', async () => {
            mockPrisma.city.findFirst.mockResolvedValue(mockCity);

            await repository.findByCityName('Paris');

            expect(mockPrisma.city.findFirst).toHaveBeenCalledTimes(1);
            expect(mockPrisma.city.findUnique).not.toHaveBeenCalled();
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.city.findFirst.mockRejectedValue(new Error('Query timeout'));

            const result = await repository.findByCityName('Paris');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find city by name');
            }
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe('create()', () => {
        const createData = { cityName: 'Lyon', zipcode: '69000' };

        it('should return ok(city) on successful creation', async () => {
            const createdCity = { id: 'city-456', refId: 2, cityName: 'Lyon', zipcode: '69000' };
            mockPrisma.city.create.mockResolvedValue(createdCity);

            const result = await repository.create(createData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(createdCity);
                expect(result.value.cityName).toBe('Lyon');
                expect(result.value.zipcode).toBe('69000');
            }
        });

        it('should pass correct data to Prisma create', async () => {
            mockPrisma.city.create.mockResolvedValue(mockCity);

            await repository.create(createData);

            expect(mockPrisma.city.create).toHaveBeenCalledWith({
                data: { cityName: 'Lyon', zipcode: '69000' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.city.create.mockRejectedValue(new Error('Unique constraint violation'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create city');
            }
        });
    });

    // ── delete ────────────────────────────────────────────────────────────

    describe('delete()', () => {
        it('should return ok(undefined) on successful deletion', async () => {
            mockPrisma.city.delete.mockResolvedValue({});

            const result = await repository.delete('city-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeUndefined();
            }
            expect(mockPrisma.city.delete).toHaveBeenCalledWith({
                where: { id: 'city-123' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.city.delete.mockRejectedValue(new Error('FK constraint violation'));

            const result = await repository.delete('city-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to delete city');
            }
        });

        it('should return err(DatabaseError) when record not found for deletion', async () => {
            mockPrisma.city.delete.mockRejectedValue(new Error('Record not found'));

            const result = await repository.delete('non-existent');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
