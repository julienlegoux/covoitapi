/**
 * @file Unit tests for the PrismaTripRepository.
 *
 * Tests all 5 methods: findAll, findById, findByFilters, create, delete.
 * Each method is tested for success and DB error propagation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaTripRepository } from './prisma-trip.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

function createMockPrisma() {
    return {
        trip: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaTripRepository', () => {
    let repository: PrismaTripRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockTrip = { id: 'trip-1', kms: 150, seats: 3, driverRefId: 1, carRefId: 1 };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaTripRepository);
    });

    describe('findAll()', () => {
        it('should return ok with data and total', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([mockTrip]);
            mockPrisma.trip.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toHaveLength(1);
                expect(result.value.total).toBe(1);
            }
        });

        it('should pass pagination params', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([]);
            mockPrisma.trip.count.mockResolvedValue(0);

            await repository.findAll({ skip: 0, take: 10 });

            expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.trip.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findById()', () => {
        it('should return ok(trip) when found', async () => {
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);

            const result = await repository.findById('trip-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockTrip);
            }
            expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'trip-1' },
            }));
        });

        it('should return ok(null) when not found', async () => {
            mockPrisma.trip.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.trip.findUnique.mockRejectedValue(new Error('DB error'));

            const result = await repository.findById('trip-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findByFilters()', () => {
        it('should return ok(trips) with no filters', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([mockTrip]);

            const result = await repository.findByFilters({});

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(1);
            }
        });

        it('should build city filter conditions for departure city', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([]);

            await repository.findByFilters({ departureCity: 'Paris' });

            expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    cities: {
                        some: {
                            city: { cityName: { contains: 'Paris', mode: 'insensitive' } },
                            type: 'DEPARTURE',
                        },
                    },
                }),
            }));
        });

        it('should build date filter conditions', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([]);

            await repository.findByFilters({ date: new Date('2025-06-15') });

            expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    dateTrip: expect.objectContaining({
                        gte: expect.any(Date),
                        lt: expect.any(Date),
                    }),
                }),
            }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.trip.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.findByFilters({});

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('create()', () => {
        it('should return ok(trip) on success', async () => {
            mockPrisma.trip.create.mockResolvedValue(mockTrip);

            const result = await repository.create({
                dateTrip: new Date('2025-06-15'),
                kms: 150,
                seats: 3,
                driverRefId: 1,
                carRefId: 1,
            });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockTrip);
            }
        });

        it('should pass city refs as nested create', async () => {
            mockPrisma.trip.create.mockResolvedValue(mockTrip);

            await repository.create({
                dateTrip: new Date('2025-06-15'),
                kms: 150,
                seats: 3,
                driverRefId: 1,
                carRefId: 1,
                cityRefIds: [10, 20],
            });

            expect(mockPrisma.trip.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    cities: {
                        create: [
                            { cityRefId: 10, type: 'DEPARTURE' },
                            { cityRefId: 20, type: 'ARRIVAL' },
                        ],
                    },
                }),
            }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.trip.create.mockRejectedValue(new Error('Create failed'));

            const result = await repository.create({
                dateTrip: new Date('2025-06-15'),
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
            mockPrisma.trip.delete.mockResolvedValue({});

            const result = await repository.delete('trip-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.trip.delete).toHaveBeenCalledWith({ where: { id: 'trip-1' } });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.trip.delete.mockRejectedValue(new Error('Delete failed'));

            const result = await repository.delete('trip-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
