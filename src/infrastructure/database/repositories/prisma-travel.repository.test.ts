/**
 * @file Unit tests for the PrismaTravelRepository.
 *
 * Tests all 5 methods: findAll, findById, findByFilters, create, delete.
 * Each method is tested for success and DB error propagation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaTravelRepository } from './prisma-travel.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

function createMockPrisma() {
    return {
        travel: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaTravelRepository', () => {
    let repository: PrismaTravelRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockTravel = { id: 'travel-1', kms: 150, seats: 3, driverRefId: 1, carRefId: 1 };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaTravelRepository);
    });

    describe('findAll()', () => {
        it('should return ok with data and total', async () => {
            mockPrisma.travel.findMany.mockResolvedValue([mockTravel]);
            mockPrisma.travel.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toHaveLength(1);
                expect(result.value.total).toBe(1);
            }
        });

        it('should pass pagination params', async () => {
            mockPrisma.travel.findMany.mockResolvedValue([]);
            mockPrisma.travel.count.mockResolvedValue(0);

            await repository.findAll({ skip: 0, take: 10 });

            expect(mockPrisma.travel.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.travel.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findById()', () => {
        it('should return ok(travel) when found', async () => {
            mockPrisma.travel.findUnique.mockResolvedValue(mockTravel);

            const result = await repository.findById('travel-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockTravel);
            }
            expect(mockPrisma.travel.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'travel-1' },
            }));
        });

        it('should return ok(null) when not found', async () => {
            mockPrisma.travel.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.travel.findUnique.mockRejectedValue(new Error('DB error'));

            const result = await repository.findById('travel-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findByFilters()', () => {
        it('should return ok(travels) with no filters', async () => {
            mockPrisma.travel.findMany.mockResolvedValue([mockTravel]);

            const result = await repository.findByFilters({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(1);
            }
        });

        it('should build city filter conditions for departure city', async () => {
            mockPrisma.travel.findMany.mockResolvedValue([]);

            await repository.findByFilters({ departureCity: 'Paris' });

            expect(mockPrisma.travel.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    AND: expect.arrayContaining([
                        expect.objectContaining({
                            cities: { some: { type: 'DEPARTURE', city: { cityName: 'Paris' } } },
                        }),
                    ]),
                }),
            }));
        });

        it('should build date filter conditions', async () => {
            mockPrisma.travel.findMany.mockResolvedValue([]);

            await repository.findByFilters({ date: '2025-06-15' });

            expect(mockPrisma.travel.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    dateRoute: expect.objectContaining({
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    }),
                }),
            }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.travel.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.findByFilters({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('create()', () => {
        it('should return ok(travel) on success', async () => {
            mockPrisma.travel.create.mockResolvedValue(mockTravel);

            const result = await repository.create({
                dateRoute: new Date('2025-06-15'),
                kms: 150,
                seats: 3,
                driverRefId: 1,
                carRefId: 1,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockTravel);
            }
        });

        it('should pass city refs as nested create', async () => {
            mockPrisma.travel.create.mockResolvedValue(mockTravel);

            await repository.create({
                dateRoute: new Date('2025-06-15'),
                kms: 150,
                seats: 3,
                driverRefId: 1,
                carRefId: 1,
                cityRefIds: [10, 20],
            });

            expect(mockPrisma.travel.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    cities: {
                        create: [
                            { cityRefId: 10, type: 'DEPARTURE' },
                            { cityRefId: 20, type: 'ARRIVAL' },
                        ],
                    },
                }),
            });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.travel.create.mockRejectedValue(new Error('Create failed'));

            const result = await repository.create({
                dateRoute: new Date('2025-06-15'),
                kms: 150,
                seats: 3,
                driverRefId: 1,
                carRefId: 1,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('delete()', () => {
        it('should return ok(undefined) on success', async () => {
            mockPrisma.travel.delete.mockResolvedValue({});

            const result = await repository.delete('travel-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.travel.delete).toHaveBeenCalledWith({ where: { id: 'travel-1' } });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.travel.delete.mockRejectedValue(new Error('Delete failed'));

            const result = await repository.delete('travel-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
