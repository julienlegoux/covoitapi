/**
 * @module cached-user.repository
 * Cache-aside decorator for {@link UserRepository}.
 * Wraps the inner PrismaUserRepository, caching reads and invalidating on writes.
 * The anonymize method cross-invalidates user, auth, driver, and inscription caches.
 */

import { inject, injectable } from 'tsyringe';
import type { CreateUserData, PublicUserEntity, UpdateUserData } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { CacheService } from '../../../domain/services/cache.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS, PRISMA_TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CacheConfig } from '../cache.config.js';
import { cacheAside, invalidatePatterns } from '../cache.utils.js';

@injectable()
export class CachedUserRepository implements UserRepository {
	private readonly logger: Logger;
	private readonly domain = 'user';

	constructor(
		@inject(PRISMA_TOKENS.UserRepository) private readonly inner: UserRepository,
		@inject(TOKENS.CacheService) private readonly cache: CacheService,
		@inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ repository: 'CachedUserRepository' });
	}

	private key(method: string, args: string): string {
		return `${this.config.keyPrefix}${this.domain}:${method}:${args}`;
	}

	async findAll(): Promise<Result<PublicUserEntity[], RepositoryError>> {
		if (!this.config.enabled) return this.inner.findAll();
		return cacheAside(this.cache, this.key('findAll', '{}'), this.config.ttl.user, () => this.inner.findAll(), this.logger);
	}

	async findById(id: string): Promise<Result<PublicUserEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findById(id);
		return cacheAside(this.cache, this.key('findById', id), this.config.ttl.user, () => this.inner.findById(id), this.logger);
	}

	async findByAuthRefId(authRefId: number): Promise<Result<PublicUserEntity | null, RepositoryError>> {
		if (!this.config.enabled) return this.inner.findByAuthRefId(authRefId);
		return cacheAside(this.cache, this.key('findByAuthRefId', String(authRefId)), this.config.ttl.user, () => this.inner.findByAuthRefId(authRefId), this.logger);
	}

	async create(data: CreateUserData): Promise<Result<PublicUserEntity, RepositoryError>> {
		const result = await this.inner.create(data);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['user:*'], this.logger);
		}
		return result;
	}

	async update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, RepositoryError>> {
		const result = await this.inner.update(id, data);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['user:*'], this.logger);
		}
		return result;
	}

	async delete(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.delete(id);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['user:*'], this.logger);
		}
		return result;
	}

	async anonymize(id: string): Promise<Result<void, RepositoryError>> {
		const result = await this.inner.anonymize(id);
		if (this.config.enabled) {
			await invalidatePatterns(this.cache, this.config.keyPrefix, ['user:*', 'auth:*', 'driver:*', 'inscription:*'], this.logger);
		}
		return result;
	}
}
