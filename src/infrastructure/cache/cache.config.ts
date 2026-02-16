/**
 * @module cache.config
 * Defines the CacheConfig type and a factory function that reads per-domain
 * TTL values from environment variables with sensible defaults.
 */

export type CacheTTLConfig = {
	brand: number;
	color: number;
	model: number;
	city: number;
	car: number;
	driver: number;
	user: number;
	auth: number;
	trip: number;
	inscription: number;
};

export type CacheConfig = {
	enabled: boolean;
	keyPrefix: string;
	ttl: CacheTTLConfig;
};

function envInt(name: string, fallback: number): number {
	const val = process.env[name];
	if (!val) return fallback;
	const parsed = Number.parseInt(val, 10);
	return Number.isNaN(parsed) ? fallback : parsed;
}

export function createCacheConfig(): CacheConfig {
	return {
		enabled: process.env.CACHE_ENABLED !== 'false',
		keyPrefix: process.env.CACHE_KEY_PREFIX ?? 'covoitapi:',
		ttl: {
			brand: envInt('CACHE_TTL_BRAND', 3600),
			color: envInt('CACHE_TTL_COLOR', 3600),
			model: envInt('CACHE_TTL_MODEL', 1800),
			city: envInt('CACHE_TTL_CITY', 1800),
			car: envInt('CACHE_TTL_CAR', 600),
			driver: envInt('CACHE_TTL_DRIVER', 600),
			user: envInt('CACHE_TTL_USER', 300),
			auth: envInt('CACHE_TTL_AUTH', 300),
			trip: envInt('CACHE_TTL_TRIP', 300),
			inscription: envInt('CACHE_TTL_INSCRIPTION', 120),
		},
	};
}
