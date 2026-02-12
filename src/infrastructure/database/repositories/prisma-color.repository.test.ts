/**
 * @file Unit tests for the PrismaColorRepository.
 *
 * Tests all 6 methods: findAll, findById, findByName, create, update, delete.
 * Each method is tested for success, edge cases, and DB error propagation.
 * Uses a mock PrismaClient injected via tsyringe to verify that each
 * repository method correctly delegates to Prisma and wraps results
 * in the Result<T, DatabaseError> pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { PrismaColorRepository } from './prisma-color.repository.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { createMockLogger } from '../../../../tests/setup.js';

/** Creates a mock PrismaClient with stubbed color model methods. */
function createMockPrisma() {
    return {
        color: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    };
}

describe('PrismaColorRepository', () => {
    let repository: PrismaColorRepository;
    let mockPrisma: ReturnType<typeof createMockPrisma>;

    const mockColor = { id: 'color-123', refId: 1, name: 'Red', hex: '#FF0000' };

    beforeEach(() => {
        container.clearInstances();
        mockPrisma = createMockPrisma();
        container.register(TOKENS.PrismaClient, { useValue: mockPrisma });
        container.registerInstance(TOKENS.Logger, createMockLogger());
        repository = container.resolve(PrismaColorRepository);
    });

    // ── findAll ───────────────────────────────────────────────────────────

    describe('findAll()', () => {
        it('should return ok with data array and total count', async () => {
            mockPrisma.color.findMany.mockResolvedValue([mockColor]);
            mockPrisma.color.count.mockResolvedValue(1);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([mockColor]);
                expect(result.value.total).toBe(1);
            }
        });

        it('should return ok with empty data when no colors exist', async () => {
            mockPrisma.color.findMany.mockResolvedValue([]);
            mockPrisma.color.count.mockResolvedValue(0);

            const result = await repository.findAll();

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.data).toEqual([]);
                expect(result.value.total).toBe(0);
            }
        });

        it('should pass pagination params to Prisma when provided', async () => {
            mockPrisma.color.findMany.mockResolvedValue([]);
            mockPrisma.color.count.mockResolvedValue(0);

            await repository.findAll({ skip: 0, take: 20 });

            expect(mockPrisma.color.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 0, take: 20 }),
            );
        });

        it('should not pass skip/take when no pagination params given', async () => {
            mockPrisma.color.findMany.mockResolvedValue([]);
            mockPrisma.color.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.color.findMany).toHaveBeenCalledWith({});
        });

        it('should call count in parallel with findMany', async () => {
            mockPrisma.color.findMany.mockResolvedValue([]);
            mockPrisma.color.count.mockResolvedValue(0);

            await repository.findAll();

            expect(mockPrisma.color.findMany).toHaveBeenCalledTimes(1);
            expect(mockPrisma.color.count).toHaveBeenCalledTimes(1);
        });

        it('should return err(DatabaseError) when findMany throws', async () => {
            mockPrisma.color.findMany.mockRejectedValue(new Error('Connection refused'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find all colors');
            }
        });

        it('should return err(DatabaseError) when count throws', async () => {
            mockPrisma.color.findMany.mockResolvedValue([]);
            mockPrisma.color.count.mockRejectedValue(new Error('Timeout'));

            const result = await repository.findAll();

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });

    // ── findById ──────────────────────────────────────────────────────────

    describe('findById()', () => {
        it('should return ok(color) when color exists', async () => {
            mockPrisma.color.findUnique.mockResolvedValue(mockColor);

            const result = await repository.findById('color-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockColor);
            }
            expect(mockPrisma.color.findUnique).toHaveBeenCalledWith({
                where: { id: 'color-123' },
            });
        });

        it('should return ok(null) when color does not exist', async () => {
            mockPrisma.color.findUnique.mockResolvedValue(null);

            const result = await repository.findById('non-existent');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.color.findUnique.mockRejectedValue(new Error('Connection lost'));

            const result = await repository.findById('color-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find color by id');
            }
        });
    });

    // ── findByName ────────────────────────────────────────────────────────

    describe('findByName()', () => {
        it('should return ok(color) when color with given name exists', async () => {
            mockPrisma.color.findFirst.mockResolvedValue(mockColor);

            const result = await repository.findByName('Red');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(mockColor);
                expect(result.value!.name).toBe('Red');
            }
            expect(mockPrisma.color.findFirst).toHaveBeenCalledWith({
                where: { name: 'Red' },
            });
        });

        it('should return ok(null) when no color with given name exists', async () => {
            mockPrisma.color.findFirst.mockResolvedValue(null);

            const result = await repository.findByName('Invisible');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeNull();
            }
        });

        it('should use findFirst since name may not be unique', async () => {
            mockPrisma.color.findFirst.mockResolvedValue(mockColor);

            await repository.findByName('Red');

            expect(mockPrisma.color.findFirst).toHaveBeenCalledTimes(1);
            expect(mockPrisma.color.findUnique).not.toHaveBeenCalled();
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.color.findFirst.mockRejectedValue(new Error('Query timeout'));

            const result = await repository.findByName('Red');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to find color by name');
            }
        });
    });

    // ── create ────────────────────────────────────────────────────────────

    describe('create()', () => {
        const createData = { name: 'Blue', hex: '#0000FF' };

        it('should return ok(color) on successful creation', async () => {
            const createdColor = { id: 'color-456', refId: 2, name: 'Blue', hex: '#0000FF' };
            mockPrisma.color.create.mockResolvedValue(createdColor);

            const result = await repository.create(createData);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(createdColor);
                expect(result.value.name).toBe('Blue');
                expect(result.value.hex).toBe('#0000FF');
            }
        });

        it('should pass correct data to Prisma create', async () => {
            mockPrisma.color.create.mockResolvedValue(mockColor);

            await repository.create(createData);

            expect(mockPrisma.color.create).toHaveBeenCalledWith({
                data: { name: 'Blue', hex: '#0000FF' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.color.create.mockRejectedValue(new Error('Unique constraint violation'));

            const result = await repository.create(createData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to create color');
            }
        });
    });

    // ── update ────────────────────────────────────────────────────────────

    describe('update()', () => {
        it('should return ok(color) on successful full update', async () => {
            const updatedColor = { id: 'color-123', refId: 1, name: 'Dark Red', hex: '#8B0000' };
            mockPrisma.color.update.mockResolvedValue(updatedColor);

            const result = await repository.update('color-123', { name: 'Dark Red', hex: '#8B0000' });

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual(updatedColor);
                expect(result.value.name).toBe('Dark Red');
                expect(result.value.hex).toBe('#8B0000');
            }
        });

        it('should pass partial update data to Prisma', async () => {
            mockPrisma.color.update.mockResolvedValue({ ...mockColor, hex: '#CC0000' });

            await repository.update('color-123', { hex: '#CC0000' });

            expect(mockPrisma.color.update).toHaveBeenCalledWith({
                where: { id: 'color-123' },
                data: { hex: '#CC0000' },
            });
        });

        it('should support updating only the name field', async () => {
            mockPrisma.color.update.mockResolvedValue({ ...mockColor, name: 'Crimson' });

            await repository.update('color-123', { name: 'Crimson' });

            expect(mockPrisma.color.update).toHaveBeenCalledWith({
                where: { id: 'color-123' },
                data: { name: 'Crimson' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.color.update.mockRejectedValue(new Error('Record not found'));

            const result = await repository.update('color-123', { name: 'Crimson' });

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to update color');
            }
        });
    });

    // ── delete ────────────────────────────────────────────────────────────

    describe('delete()', () => {
        it('should return ok(undefined) on successful deletion', async () => {
            mockPrisma.color.delete.mockResolvedValue({});

            const result = await repository.delete('color-123');

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toBeUndefined();
            }
            expect(mockPrisma.color.delete).toHaveBeenCalledWith({
                where: { id: 'color-123' },
            });
        });

        it('should return err(DatabaseError) on Prisma error', async () => {
            mockPrisma.color.delete.mockRejectedValue(new Error('FK constraint violation'));

            const result = await repository.delete('color-123');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
                expect(result.error.message).toBe('Failed to delete color');
            }
        });

        it('should return err(DatabaseError) when record not found for deletion', async () => {
            mockPrisma.color.delete.mockRejectedValue(new Error('Record not found'));

            const result = await repository.delete('non-existent');

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeInstanceOf(DatabaseError);
            }
        });
    });
});
