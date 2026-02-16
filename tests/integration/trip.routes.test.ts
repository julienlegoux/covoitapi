import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { ListTripsUseCase } from '../../src/application/use-cases/trip/list-trips.use-case.js';
import { GetTripUseCase } from '../../src/application/use-cases/trip/get-trip.use-case.js';
import { FindTripUseCase } from '../../src/application/use-cases/trip/find-trip.use-case.js';
import { CreateTripUseCase } from '../../src/application/use-cases/trip/create-trip.use-case.js';
import { DeleteTripUseCase } from '../../src/application/use-cases/trip/delete-trip.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { TripNotFoundError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';
import { createMockLogger } from '../setup.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
    PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Trip Routes', () => {
    let listMock: { execute: ReturnType<typeof vi.fn> };
    let getMock: { execute: ReturnType<typeof vi.fn> };
    let findMock: { execute: ReturnType<typeof vi.fn> };
    let createMock: { execute: ReturnType<typeof vi.fn> };
    let deleteMock: { execute: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(TOKENS.Logger, createMockLogger());
        registerMockJwtService();
        listMock = registerMockUseCase(ListTripsUseCase);
        getMock = registerMockUseCase(GetTripUseCase);
        findMock = registerMockUseCase(FindTripUseCase);
        createMock = registerMockUseCase(CreateTripUseCase);
        deleteMock = registerMockUseCase(DeleteTripUseCase);
    });

    describe('GET /api/v1/trips', () => {
        it('should return 200 with trips', async () => {
            const trips = [{ id: 'r1', kms: 100, seats: 3 }];
            listMock.execute.mockResolvedValue(ok(trips));
            const res = await app.request('/api/v1/trips', { headers: authHeaders() });
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body).toEqual({ success: true, data: trips });
        });

        it('should return 401 without auth token', async () => {
            const res = await app.request('/api/v1/trips');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/v1/trips/:id', () => {
        it('should return 200 with trip', async () => {
            const trip = { id: TEST_UUID, kms: 100 };
            getMock.execute.mockResolvedValue(ok(trip));
            const res = await app.request(`/api/v1/trips/${TEST_UUID}`, { headers: authHeaders() });
            expect(res.status).toBe(200);
            expect(getMock.execute).toHaveBeenCalledWith(TEST_UUID);
        });

        it('should return 404 when not found', async () => {
            getMock.execute.mockResolvedValue(err(new TripNotFoundError(TEST_UUID)));
            const res = await app.request(`/api/v1/trips/${TEST_UUID}`, { headers: authHeaders() });
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/v1/trips/search', () => {
        it('should pass query params to use case', async () => {
            findMock.execute.mockResolvedValue(ok([]));
            const res = await app.request('/api/v1/trips/search?departureCity=Paris&arrivalCity=Lyon&date=2025-06-15', { headers: authHeaders() });
            expect(res.status).toBe(200);
            expect(findMock.execute).toHaveBeenCalledWith({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });
        });

        it('should handle missing query params', async () => {
            findMock.execute.mockResolvedValue(ok([]));
            const res = await app.request('/api/v1/trips/search', { headers: authHeaders() });
            expect(res.status).toBe(200);
            expect(findMock.execute).toHaveBeenCalledWith({ departureCity: undefined, arrivalCity: undefined, date: undefined });
        });
    });

    describe('POST /api/v1/trips', () => {
        const validBody = { kms: 150, date: '2025-06-15', departureCity: 'Paris', arrivalCity: 'Lyon', seats: 3, carId: 'c1' };

        it('should return 201 on success', async () => {
            const trip = { id: 'r1' };
            createMock.execute.mockResolvedValue(ok(trip));
            const res = await app.request('/api/v1/trips', {
                method: 'POST',
                body: JSON.stringify(validBody),
                headers: authHeaders(),
            });
            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body).toEqual({ success: true, data: trip });
        });

        it('should reject invalid input', async () => {
            const res = await app.request('/api/v1/trips', {
                method: 'POST',
                body: JSON.stringify({}),
                headers: authHeaders(),
            });
            expect(res.ok).toBe(false);
        });
    });

    describe('DELETE /api/v1/trips/:id', () => {
        it('should return 204 on success', async () => {
            deleteMock.execute.mockResolvedValue(ok(undefined));
            const res = await app.request(`/api/v1/trips/${TEST_UUID}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            expect(res.status).toBe(204);
        });

        it('should return 404 when not found', async () => {
            deleteMock.execute.mockResolvedValue(err(new TripNotFoundError(TEST_UUID)));
            const res = await app.request(`/api/v1/trips/${TEST_UUID}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            expect(res.status).toBe(404);
        });
    });
});
