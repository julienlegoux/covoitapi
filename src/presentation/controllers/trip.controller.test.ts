/**
 * Unit tests for the TripController (trip handlers).
 * Covers listTrips, getTrip, findTrip (search by query params),
 * createTrip (with userId from auth context), and deleteTrip.
 * Verifies HTTP status codes, query parameter extraction, userId injection,
 * Zod validation, and TRIP_NOT_FOUND error propagation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listTrips, getTrip, findTrip, createTrip, deleteTrip } from './trip.controller.js';
import { ListTripsUseCase } from '../../application/use-cases/trip/list-trips.use-case.js';
import { GetTripUseCase } from '../../application/use-cases/trip/get-trip.use-case.js';
import { FindTripUseCase } from '../../application/use-cases/trip/find-trip.use-case.js';
import { CreateTripUseCase } from '../../application/use-cases/trip/create-trip.use-case.js';
import { DeleteTripUseCase } from '../../application/use-cases/trip/delete-trip.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { TripNotFoundError } from '../../lib/errors/domain.errors.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string>; queryParams?: Record<string, string>; userId?: string }) {
    const jsonMock = vi.fn((body, status) => ({ body, status }));
    const bodyMock = vi.fn((body, status) => new Response(body, { status }));
    const contextValues: Record<string, unknown> = {};
    if (overrides?.userId) {
        contextValues['userId'] = overrides.userId;
    }
    return {
        req: {
            json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
            param: vi.fn((name: string) => overrides?.params?.[name]),
            query: vi.fn((name: string) => overrides?.queryParams?.[name]),
        },
        json: jsonMock,
        body: bodyMock,
        get: vi.fn((key: string) => contextValues[key]),
        _getJsonCall: () => jsonMock.mock.calls[0],
        _getBodyCall: () => bodyMock.mock.calls[0],
    } as unknown as Context & { _getJsonCall: () => [unknown, number]; _getBodyCall: () => [unknown, number] };
}

describe('Trip Controller', () => {
    // Listing all available trips
    describe('listTrips()', () => {
        let mockUseCase: { execute: ReturnType<typeof vi.fn> };
        beforeEach(() => {
            container.clearInstances();
            mockUseCase = { execute: vi.fn() };
            container.register(ListTripsUseCase, { useValue: mockUseCase as unknown as ListTripsUseCase });
        });

        it('should return 200 with list of trips', async () => {
            mockUseCase.execute.mockResolvedValue(ok([]));
            const ctx = createMockContext();
            await listTrips(ctx);
            const [response, status] = ctx._getJsonCall();
            expect(status).toBe(200);
            expect(response).toEqual({ success: true, data: [] });
        });
    });

    // Getting a single trip by UUID
    describe('getTrip()', () => {
        let mockUseCase: { execute: ReturnType<typeof vi.fn> };
        beforeEach(() => {
            container.clearInstances();
            mockUseCase = { execute: vi.fn() };
            container.register(GetTripUseCase, { useValue: mockUseCase as unknown as GetTripUseCase });
        });

        it('should return 200 with trip', async () => {
            const trip = { id: TEST_UUID, kms: 100, seats: 3 };
            mockUseCase.execute.mockResolvedValue(ok(trip));
            const ctx = createMockContext({ params: { id: TEST_UUID } });
            await getTrip(ctx);
            const [response, status] = ctx._getJsonCall();
            expect(status).toBe(200);
            expect(mockUseCase.execute).toHaveBeenCalledWith(TEST_UUID);
        });

        it('should return error when trip not found', async () => {
            mockUseCase.execute.mockResolvedValue(err(new TripNotFoundError(TEST_UUID)));
            const ctx = createMockContext({ params: { id: TEST_UUID } });
            await getTrip(ctx);
            const [response] = ctx._getJsonCall();
            expect(response).toHaveProperty('success', false);
        });
    });

    // Searching trips by departureCity, arrivalCity, and date query params
    describe('findTrip()', () => {
        let mockUseCase: { execute: ReturnType<typeof vi.fn> };
        beforeEach(() => {
            container.clearInstances();
            mockUseCase = { execute: vi.fn() };
            container.register(FindTripUseCase, { useValue: mockUseCase as unknown as FindTripUseCase });
        });

        it('should return 200 with filtered trips', async () => {
            mockUseCase.execute.mockResolvedValue(ok([]));
            const ctx = createMockContext({ queryParams: { departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' } });
            await findTrip(ctx);
            expect(mockUseCase.execute).toHaveBeenCalledWith({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });
            const [, status] = ctx._getJsonCall();
            expect(status).toBe(200);
        });

        it('should pass undefined for missing query params', async () => {
            mockUseCase.execute.mockResolvedValue(ok([]));
            const ctx = createMockContext({ queryParams: {} });
            await findTrip(ctx);
            expect(mockUseCase.execute).toHaveBeenCalledWith({ departureCity: undefined, arrivalCity: undefined, date: undefined });
        });
    });

    // Trip creation with userId injected from auth context
    describe('createTrip()', () => {
        let mockUseCase: { execute: ReturnType<typeof vi.fn> };
        beforeEach(() => {
            container.clearInstances();
            mockUseCase = { execute: vi.fn() };
            container.register(CreateTripUseCase, { useValue: mockUseCase as unknown as CreateTripUseCase });
        });

        it('should return 201 on success and use userId from context', async () => {
            mockUseCase.execute.mockResolvedValue(ok({ id: TEST_UUID }));
            const body = { kms: 150, date: '2025-06-15', departureCity: 'Paris', arrivalCity: 'Lyon', seats: 3, carId: 'c1' };
            const ctx = createMockContext({ jsonBody: body, userId: TEST_USER_ID });
            await createTrip(ctx);
            const [response, status] = ctx._getJsonCall();
            expect(status).toBe(201);
            expect(mockUseCase.execute).toHaveBeenCalledWith({
                kms: 150,
                userId: TEST_USER_ID,
                date: '2025-06-15',
                departureCity: 'Paris',
                arrivalCity: 'Lyon',
                seats: 3,
                carId: 'c1',
            });
        });

        it('should throw ZodError for invalid input', async () => {
            const ctx = createMockContext({ jsonBody: {}, userId: TEST_USER_ID });
            await expect(createTrip(ctx)).rejects.toThrow();
        });
    });

    // Trip deletion by UUID
    describe('deleteTrip()', () => {
        let mockUseCase: { execute: ReturnType<typeof vi.fn> };
        beforeEach(() => {
            container.clearInstances();
            mockUseCase = { execute: vi.fn() };
            container.register(DeleteTripUseCase, { useValue: mockUseCase as unknown as DeleteTripUseCase });
        });

        it('should return 204 on successful delete', async () => {
            mockUseCase.execute.mockResolvedValue(ok(undefined));
            const ctx = createMockContext({ params: { id: TEST_UUID }, userId: TEST_USER_ID });
            const response = await deleteTrip(ctx);
            expect(response.status).toBe(204);
        });

        it('should return error when trip not found', async () => {
            mockUseCase.execute.mockResolvedValue(err(new TripNotFoundError(TEST_UUID)));
            const ctx = createMockContext({ params: { id: TEST_UUID }, userId: TEST_USER_ID });
            await deleteTrip(ctx);
            const [response] = ctx._getJsonCall();
            expect(response).toHaveProperty('success', false);
        });
    });
});
