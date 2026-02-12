/**
 * @file Unit tests for the PrismaInscriptionRepository.
 *
 * Tests key methods: findAll, findById, create, delete,
 * existsByUserAndRoute, countByRouteRefId. Each method is tested
 * for success and DB error propagation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaInscriptionRepository } from './prisma-inscription.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

function createMockPrisma() {
    return {
        inscription: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaInscriptionRepository', () => {
    let repository: PrismaInscriptionRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockInscription = { id: 'ins-1', refId: 1, userRefId: 1, routeRefId: 1 };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaInscriptionRepository);
    });

    describe('findAll()', () => {
        it('should return ok with data and total', async () => {
            mockPrisma.inscription.findMany.mockResolvedValue([mockInscription]);
            mockPrisma.inscription.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toHaveLength(1);
                expect(result.value.total).toBe(1);
            }
        });

        it('should pass pagination params', async () => {
            mockPrisma.inscription.findMany.mockResolvedValue([]);
            mockPrisma.inscription.count.mockResolvedValue(0);

            await repository.findAll({ skip: 0, take: 10 });

            expect(mockPrisma.inscription.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.findMany.mockRejectedValue(new Error('DB error'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('findById()', () => {
        it('should return ok(inscription) when found', async () => {
            mockPrisma.inscription.findUnique.mockResolvedValue(mockInscription);

            const result = await repository.findById('ins-1');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockInscription);
            }
        });

        it('should return ok(null) when not found', async () => {
            mockPrisma.inscription.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.findUnique.mockRejectedValue(new Error('DB error'));

            const result = await repository.findById('ins-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('create()', () => {
        it('should return ok(inscription) on success', async () => {
            mockPrisma.inscription.create.mockResolvedValue(mockInscription);

            const result = await repository.create({ userRefId: 1, routeRefId: 1 });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockInscription);
            }
            expect(mockPrisma.inscription.create).toHaveBeenCalledWith({
                data: { userRefId: 1, routeRefId: 1 },
            });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.create.mockRejectedValue(new Error('Unique constraint'));

            const result = await repository.create({ userRefId: 1, routeRefId: 1 });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('delete()', () => {
        it('should return ok(undefined) on success', async () => {
            mockPrisma.inscription.delete.mockResolvedValue({});

            const result = await repository.delete('ins-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.inscription.delete).toHaveBeenCalledWith({ where: { id: 'ins-1' } });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.delete.mockRejectedValue(new Error('Not found'));

            const result = await repository.delete('ins-1');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('existsByUserAndRoute()', () => {
        it('should return ok(true) when inscription exists', async () => {
            mockPrisma.inscription.count.mockResolvedValue(1);

            const result = await repository.existsByUserAndRoute(1, 1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(true);
            }
            expect(mockPrisma.inscription.count).toHaveBeenCalledWith({
                where: { userRefId: 1, routeRefId: 1 },
            });
        });

        it('should return ok(false) when not inscribed', async () => {
            mockPrisma.inscription.count.mockResolvedValue(0);

            const result = await repository.existsByUserAndRoute(1, 2);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(false);
            }
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.count.mockRejectedValue(new Error('DB down'));

            const result = await repository.existsByUserAndRoute(1, 1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    describe('countByRouteRefId()', () => {
        it('should return ok(count) on success', async () => {
            mockPrisma.inscription.count.mockResolvedValue(5);

            const result = await repository.countByRouteRefId(1);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBe(5);
            }
            expect(mockPrisma.inscription.count).toHaveBeenCalledWith({
                where: { routeRefId: 1 },
            });
        });

        it('should return err(DatabaseError) on failure', async () => {
            mockPrisma.inscription.count.mockRejectedValue(new Error('DB error'));

            const result = await repository.countByRouteRefId(1);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
