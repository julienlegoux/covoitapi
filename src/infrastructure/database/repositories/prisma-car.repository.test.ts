/**
 * @file Unit tests for the PrismaCarRepository.
 *
 * Tests all 6 methods: findAll, findById, create, update, delete,
 * existsByLicensePlate. Verifies the immat ↔ licensePlate field mapping
 * and Result<T, DatabaseError> wrapping for success and error cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaCarRepository } from './prisma-car.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

function createMockPrisma() {
    return {
        car: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaCarRepository', () => {
    let repository: PrismaCarRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockPrismaCar = { id: 'car-1', refId: 1, immat: 'AB-123-CD', modelRefId: 1, driverRefId: 1 };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaCarRepository);
    });

    describe('findAll()', () => {
        it('should return ok with mapped entities and total count', async () => {
            mockPrisma.car.findMany.mockResolvedValue([mockPrismaCar]);
            mockPrisma.car.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([{ id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 1, driverRefId: 1 }]);
                expect(result.value.total).toBe(1);
            }
        });

        it('should pass pagination params', async () => {
            mockPrisma.car.findMany.mockResolvedValue([]);
            mockPrisma.car.count.mockResolvedValue(0);

            await repository.findAll({ skip: 0, take: 10 });

            expect(mockPrisma.car.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.findMany.mockRejectedValue(new Error('DB down'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findById()', () => {
        it('should return ok(car) with licensePlate mapped from immat', async () => {
            mockPrisma.car.findUnique.mockResolvedValue(mockPrismaCar);

            const result = await repository.findById('car-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual({ id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 1, driverRefId: 1 });
            }
        });

        it('should return ok(null) when not found', async () => {
            mockPrisma.car.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.findUnique.mockRejectedValue(new Error('DB error'));

            const result = await repository.findById('car-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('create()', () => {
        it('should map licensePlate to immat and return ok(car)', async () => {
            mockPrisma.car.create.mockResolvedValue(mockPrismaCar);

            const result = await repository.create({ licensePlate: 'AB-123-CD', modelRefId: 1, driverRefId: 1 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.licensePlate).toBe('AB-123-CD');
            }
            expect(mockPrisma.car.create).toHaveBeenCalledWith({
                data: { immat: 'AB-123-CD', modelRefId: 1, driverRefId: 1 },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.create.mockRejectedValue(new Error('Unique constraint'));

            const result = await repository.create({ licensePlate: 'AB-123-CD', modelRefId: 1, driverRefId: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('update()', () => {
        it('should map licensePlate to immat in update data', async () => {
            mockPrisma.car.update.mockResolvedValue({ ...mockPrismaCar, immat: 'XY-999-ZZ' });

            const result = await repository.update('car-1', { licensePlate: 'XY-999-ZZ' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.licensePlate).toBe('XY-999-ZZ');
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.update.mockRejectedValue(new Error('Not found'));

            const result = await repository.update('car-1', { licensePlate: 'XY-999-ZZ' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('delete()', () => {
        it('should return ok(undefined) on success', async () => {
            mockPrisma.car.delete.mockResolvedValue({});

            const result = await repository.delete('car-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.car.delete).toHaveBeenCalledWith({ where: { id: 'car-1' } });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.delete.mockRejectedValue(new Error('Constraint violation'));

            const result = await repository.delete('car-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('existsByLicensePlate()', () => {
        it('should return ok(true) when plate exists', async () => {
            mockPrisma.car.count.mockResolvedValue(1);

            const result = await repository.existsByLicensePlate('AB-123-CD');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(true);
            }
            expect(mockPrisma.car.count).toHaveBeenCalledWith({ where: { immat: 'AB-123-CD' } });
        });

        it('should return ok(false) when plate does not exist', async () => {
            mockPrisma.car.count.mockResolvedValue(0);

            const result = await repository.existsByLicensePlate('XX-000-YY');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(false);
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.car.count.mockRejectedValue(new Error('DB error'));

            const result = await repository.existsByLicensePlate('AB-123-CD');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
