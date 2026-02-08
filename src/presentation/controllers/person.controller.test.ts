import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listPersons, getPerson, createPerson, updatePerson, patchPerson, deletePerson } from './person.controller.js';
import { ListPersonsUseCase } from '../../application/use-cases/person/list-persons.use-case.js';
import { GetPersonUseCase } from '../../application/use-cases/person/get-person.use-case.js';
import { CreatePersonUseCase } from '../../application/use-cases/person/create-person.use-case.js';
import { UpdatePersonUseCase } from '../../application/use-cases/person/update-person.use-case.js';
import { DeletePersonUseCase } from '../../application/use-cases/person/delete-person.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { UserNotFoundError } from '../../lib/errors/domain.errors.js';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string> }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			param: vi.fn((name: string) => overrides?.params?.[name]),
		},
		json: jsonMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Person Controller', () => {
	describe('listPersons()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListPersonsUseCase, { useValue: mockUseCase as unknown as ListPersonsUseCase });
		});

		it('should return 200 with list of persons', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext();
			await listPersons(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: [] });
		});
	});

	describe('getPerson()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(GetPersonUseCase, { useValue: mockUseCase as unknown as GetPersonUseCase });
		});

		it('should return 200 with person', async () => {
			const user = { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B' };
			mockUseCase.execute.mockResolvedValue(ok(user));
			const ctx = createMockContext({ params: { id: '1' } });
			await getPerson(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(mockUseCase.execute).toHaveBeenCalledWith('1');
		});

		it('should return error when person not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new UserNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await getPerson(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('createPerson()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreatePersonUseCase, { useValue: mockUseCase as unknown as CreatePersonUseCase });
		});

		it('should return 201 on success', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1' }));
			const ctx = createMockContext({ jsonBody: { firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'j@d.com', password: 'Password1' } });
			await createPerson(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
		});

		it('should map firstName, lastName, phone correctly', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1' }));
			const ctx = createMockContext({ jsonBody: { firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'j@d.com', password: 'Pass1234' } });
			await createPerson(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({
				firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'j@d.com', password: 'Pass1234',
			});
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createPerson(ctx)).rejects.toThrow();
		});
	});

	describe('updatePerson()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdatePersonUseCase, { useValue: mockUseCase as unknown as UpdatePersonUseCase });
		});

		it('should return 200 and extract id from params', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1' }));
			const ctx = createMockContext({ jsonBody: { firstName: 'John', lastName: 'Doe', phone: '06', email: 'j@d.com' }, params: { id: 'u1' } });
			await updatePerson(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith('u1', { firstName: 'John', lastName: 'Doe', phone: '06', email: 'j@d.com' });
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	describe('patchPerson()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdatePersonUseCase, { useValue: mockUseCase as unknown as UpdatePersonUseCase });
		});

		it('should return 200 and map phone, email', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1' }));
			const ctx = createMockContext({ jsonBody: { phone: '0712345678', email: 'new@test.com' }, params: { id: 'u1' } });
			await patchPerson(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith('u1', { phone: '0712345678', email: 'new@test.com' });
		});
	});

	describe('deletePerson()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeletePersonUseCase, { useValue: mockUseCase as unknown as DeletePersonUseCase });
		});

		it('should return 200 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			await deletePerson(ctx);
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});

		it('should return error when person not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new UserNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deletePerson(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
