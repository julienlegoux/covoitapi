/**
 * @module prisma-user.repository
 * Prisma-backed implementation of the {@link UserRepository} domain interface.
 * Manages user profile CRUD operations and GDPR-compliant anonymization.
 * Every read method joins the `auth` relation to include the email,
 * producing {@link PublicUserEntity} (UserEntity + email from Auth).
 */

import crypto from 'node:crypto';
import { inject, injectable } from 'tsyringe';
import type { CreateUserData, PublicUserEntity, UpdateUserData } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Prisma implementation of {@link UserRepository}.
 * Operates on the `user` table and always includes `auth.email` via Prisma's
 * `include` / `select` to build {@link PublicUserEntity} results.
 * Injected via tsyringe with the PrismaClient token.
 */
@injectable()
export class PrismaUserRepository implements UserRepository {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.PrismaClient)
		private readonly prisma: PrismaClient,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'UserRepository' });
	}

	/**
	 * Retrieves all user profiles with their associated email addresses.
	 * @returns `ok(PublicUserEntity[])` on success, or `err(DatabaseError)` on failure.
	 */
	async findAll(): Promise<Result<PublicUserEntity[], DatabaseError>> {
		try {
			// Include auth relation but select only email to form PublicUserEntity
			const users = await this.prisma.user.findMany({
				where: { anonymizedAt: null },
				include: { auth: { select: { email: true } } },
			});
			return ok(users.map((u) => ({ ...u, email: u.auth.email })));
		} catch (e) {
			this.logger.error('Failed to find all users', e instanceof Error ? e : null, { operation: 'findAll' });
			return err(new DatabaseError('Failed to find all users', e));
		}
	}

	/**
	 * Finds a single user by their UUID primary key.
	 * @param id - The UUID of the user.
	 * @returns `ok(PublicUserEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findById(id: string): Promise<Result<PublicUserEntity | null, DatabaseError>> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id },
				// Join auth to retrieve the email for PublicUserEntity
				include: { auth: { select: { email: true } } },
			});
			if (!user) return ok(null);
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			this.logger.error('Failed to find user by ID', e instanceof Error ? e : null, { operation: 'findById', userId: id });
			return err(new DatabaseError('Failed to find user by id', e));
		}
	}

	/**
	 * Finds a user by the integer authRefId foreign key linking to the auth table.
	 * Used after authentication to resolve the logged-in user's profile.
	 * @param authRefId - The integer auto-incremented reference ID from the auth record.
	 * @returns `ok(PublicUserEntity)` if found, `ok(null)` if not found,
	 *          or `err(DatabaseError)` on failure.
	 */
	async findByAuthRefId(authRefId: number): Promise<Result<PublicUserEntity | null, DatabaseError>> {
		try {
			// authRefId is a unique int FK on the user table
			const user = await this.prisma.user.findUnique({
				where: { authRefId },
				include: { auth: { select: { email: true } } },
			});
			if (!user) return ok(null);
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			this.logger.error('Failed to find user by auth ref ID', e instanceof Error ? e : null, { operation: 'findByAuthRefId', authRefId });
			return err(new DatabaseError('Failed to find user by auth ref id', e));
		}
	}

	/**
	 * Creates a new user profile linked to an existing auth record via authRefId.
	 * @param data - User creation data including firstName, lastName, phone, and authRefId.
	 * @returns `ok(PublicUserEntity)` with the created user (including email),
	 *          or `err(DatabaseError)` on failure (e.g. unique constraint violation).
	 */
	async create(data: CreateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.create({
				data: {
					firstName: data.firstName,
					lastName: data.lastName,
					phone: data.phone,
					authRefId: data.authRefId,
				},
				// Include auth email in the response for PublicUserEntity
				include: { auth: { select: { email: true } } },
			});
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			this.logger.error('Failed to create user', e instanceof Error ? e : null, { operation: 'create', authRefId: data.authRefId });
			return err(new DatabaseError('Failed to create user', e));
		}
	}

	/**
	 * Partially updates a user profile identified by UUID.
	 * @param id - The UUID of the user to update.
	 * @param data - Partial update payload (firstName, lastName, phone).
	 * @returns `ok(PublicUserEntity)` with the updated user,
	 *          or `err(DatabaseError)` on failure.
	 */
	async update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, DatabaseError>> {
		try {
			const user = await this.prisma.user.update({
				where: { id },
				data,
				include: { auth: { select: { email: true } } },
			});
			return ok({ ...user, email: user.auth.email });
		} catch (e) {
			this.logger.error('Failed to update user', e instanceof Error ? e : null, { operation: 'update', userId: id });
			return err(new DatabaseError('Failed to update user', e));
		}
	}

	/**
	 * Hard-deletes a user record by UUID.
	 * @param id - The UUID of the user to delete.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async delete(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.user.delete({
				where: { id },
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to delete user', e instanceof Error ? e : null, { operation: 'delete', userId: id });
			return err(new DatabaseError('Failed to delete user', e));
		}
	}

	/**
	 * GDPR-compliant anonymization of a user and all related records.
	 * Runs within a Prisma interactive transaction to ensure atomicity across
	 * four tables: auth, user, driver, and inscription.
	 *
	 * Steps performed inside the transaction:
	 * 1. Replace auth email/password with random values and set anonymizedAt.
	 * 2. Null out user profile fields (firstName, lastName, phone) and set anonymizedAt.
	 * 3. Replace driver license with an anonymized placeholder if a driver record exists.
	 * 4. Mark all inscriptions for this user as "ANONYMIZED" status.
	 *
	 * @param id - The UUID of the user to anonymize.
	 * @returns `ok(undefined)` on success, or `err(DatabaseError)` on failure.
	 */
	async anonymize(id: string): Promise<Result<void, DatabaseError>> {
		try {
			await this.prisma.$transaction(async (tx) => {
				// Fetch the user first to get refId for cross-table lookups
				const user = await tx.user.findUniqueOrThrow({
					where: { id },
				});

				// 1. Anonymize auth (email, password)
				await tx.auth.update({
					// Locate auth by the int refId FK from the user record
					where: { refId: user.authRefId },
					data: {
						email: `deleted-${crypto.randomUUID()}@anonymized.local`,
						password: crypto.randomUUID(),
						anonymizedAt: new Date(),
					},
				});

				// 2. Anonymize user profile
				await tx.user.update({
					where: { id },
					data: {
						firstName: null,
						lastName: null,
						phone: null,
						anonymizedAt: new Date(),
					},
				});

				// 3. Anonymize driver if exists (updateMany is safe when no rows match)
				await tx.driver.updateMany({
					where: { userRefId: user.refId },
					data: {
						driverLicense: `ANONYMIZED-${crypto.randomUUID()}`,
						anonymizedAt: new Date(),
					},
				});

				// 4. Mark inscriptions as ANONYMIZED
				await tx.inscription.updateMany({
					where: { userRefId: user.refId },
					data: { status: 'ANONYMIZED' },
				});
			});
			return ok(undefined);
		} catch (e) {
			this.logger.error('Failed to anonymize user', e instanceof Error ? e : null, { operation: 'anonymize', userId: id });
			return err(new DatabaseError('Failed to anonymize user', e));
		}
	}
}
