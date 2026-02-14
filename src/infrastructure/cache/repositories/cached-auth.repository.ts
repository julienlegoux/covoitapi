/**
 * @module cached-auth.repository
 * Cache-aside decorator for {@link AuthRepository}.
 * Wraps the inner PrismaAuthRepository, caching reads and invalidating on writes.
 * The createWithUser method cross-invalidates both auth and user caches.
 */

import { inject, injectable } from 'tsyringe';
import type { AuthEntity, CreateAuthData } from '../../../domain/entities/auth.entity.js';
import type { CreateUserData, PublicUserEntity } from '../../../domain/entities/user.entity.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedAuthRepository implements AuthRepository {
	private readonly logger: Logger;
	private readonly domain = 'auth';

	constructor(
		@inject(PRISMA_TOKENS.AuthRepository) private readonly inner: AuthRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedAuthRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findByEmail(email: string): Promise<Result<AuthEntity | null, RepositoryError>> {
		return this.inner.findByEmail(email);
	}

	async existsByEmail(email: string): Promise<Result<boolean, RepositoryError>> {
		return this.inner.existsByEmail(email);
	}

	async createWithUser(
		authData: CreateAuthData,
		userData: Omit<CreateUserData, 'authRefId'>,
	): Promise<Result<{ auth: AuthEntity; user: PublicUserEntity }, RepositoryError>> {
		const result = await this.inner.createWithUser(authData, userData);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['auth:*', 'user:*'], this.logger);
		}
		return result;
	}

	async updateRole(refId: number, role: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.updateRole(refId, role);
		if (this.config.enabled && result.success) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['auth:*'], this.logger);
		}
		return result;
	}
}
