# Redis Caching Architecture

## Overview

Cache layer using **Upstash Redis** (`@upstash/redis`) with the **decorator repository pattern**. Each `CachedXRepository` wraps its `PrismaXRepository`, caching reads and invalidating on writes. Use cases and controllers remain untouched.

```
HTTP Request
  → Controller
    → Use Case
      → CachedXRepository  (cache hit? return cached)
        → PrismaXRepository (cache miss → query DB → cache result)
```

## Setup

### 1. Install

```bash
pnpm add @upstash/redis
```

### 2. Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Optional overrides
CACHE_ENABLED=true          # set to "false" to disable caching entirely
CACHE_KEY_PREFIX=covoitapi: # namespace all keys
```

## Architecture

### Two-Token DI Pattern

The core challenge: both `CachedCityRepository` and `PrismaCityRepository` implement `CityRepository`. To avoid circular DI resolution, we use separate token sets:

```
PRISMA_TOKENS.CityRepository  →  PrismaCityRepository   (inner, raw DB)
TOKENS.CityRepository         →  CachedCityRepository    (outer, public)
```

Use cases inject `TOKENS.CityRepository` — they get the cached version transparently.

```ts
// tokens.ts
export const PRISMA_TOKENS = {
  CityRepository: Symbol('PrismaCityRepository'),
  // ... one per repository
} as const;

export const TOKENS = {
  // ... existing tokens
  CacheService: Symbol('CacheService'),
  CacheConfig: Symbol('CacheConfig'),
} as const;
```

```ts
// container.ts
container.register(PRISMA_TOKENS.CityRepository, { useClass: PrismaCityRepository });
container.register(TOKENS.CityRepository, { useClass: CachedCityRepository });
```

### CacheService Interface

Lives in the domain layer (`src/domain/services/cache.service.ts`) — no Redis imports.

```ts
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPattern(pattern: string): Promise<void>;
  isHealthy(): Promise<boolean>;
}
```

### Cache-Aside Helper

Shared utility (`src/infrastructure/cache/cache.utils.ts`) reused by all 10 decorators:

```ts
type CacheWrapper<T> = { __cached: true; data: T };

async function cacheAside<T, E>(
  cache: CacheService,
  key: string,
  ttl: number,
  source: () => Promise<Result<T, E>>,
): Promise<Result<T, E>>
```

- Try cache → if `{ __cached: true, data }` found, return `ok(data)`
- On miss → call source, cache successful results as `{ __cached: true, data }`, return
- On Redis error → fall through to source silently (logged as warning)

The `__cached` wrapper distinguishes a cache miss (`null`) from a cached `null` value (e.g. `findById` returning `ok(null)`).

### Cached Repository Pattern

```ts
@injectable()
export class CachedCityRepository implements CityRepository {
  constructor(
    @inject(PRISMA_TOKENS.CityRepository) private readonly inner: CityRepository,
    @inject(TOKENS.CacheService) private readonly cache: CacheService,
    @inject(TOKENS.CacheConfig) private readonly config: CacheConfig,
  ) {}

  // Reads → cacheAside(cache, key, ttl, () => inner.method(...args))
  // Writes → inner.method(...args) then invalidatePatterns(cache, ['city:*'])
}
```

## Cache Key Format

```
{prefix}{domain}:{method}:{serialized-args}
```

Examples:
- `covoitapi:city:findAll:{}`
- `covoitapi:city:findAll:{"skip":0,"take":20}`
- `covoitapi:city:findById:abc-uuid-123`
- `covoitapi:travel:findByFilters:{"departureCity":"Lyon"}`

## TTL Configuration

Per-domain TTLs, configurable via env vars with defaults:

| Domain | Default TTL | Env Override | Rationale |
|---|---|---|---|
| Brand | 3600s (1h) | `CACHE_TTL_BRAND` | Static reference data |
| Color | 3600s (1h) | `CACHE_TTL_COLOR` | Static reference data |
| Model | 1800s (30m) | `CACHE_TTL_MODEL` | Rarely changes |
| City | 1800s (30m) | `CACHE_TTL_CITY` | Rarely changes |
| Car | 600s (10m) | `CACHE_TTL_CAR` | Moderate updates |
| Driver | 600s (10m) | `CACHE_TTL_DRIVER` | Moderate updates |
| User | 300s (5m) | `CACHE_TTL_USER` | Profile updates |
| Auth | 300s (5m) | `CACHE_TTL_AUTH` | Sensitive data |
| Travel | 300s (5m) | `CACHE_TTL_TRAVEL` | Active data |
| Inscription | 120s (2m) | `CACHE_TTL_INSCRIPTION` | Seat availability matters |

## Cache Invalidation

Write operations invalidate the entire domain prefix. Conservative but safe.

| Repository | Cached Reads | Writes → Invalidate | Cross-Invalidation |
|---|---|---|---|
| City | findAll, findById, findByCityName | create, delete → `city:*` | — |
| Brand | findAll, findById | create, delete → `brand:*` | — |
| Color | findAll, findById, findByName | create, update, delete → `color:*` | — |
| Model | findAll, findById, findByNameAndBrand | create → `model:*` | — |
| Car | findAll, findById, existsByLicensePlate | create, update, delete → `car:*` | — |
| Driver | findByUserRefId | create → `driver:*` | — |
| User | findAll, findById, findByAuthRefId | create, update, delete → `user:*` | anonymize → `user:*` + `auth:*` + `driver:*` + `inscription:*` |
| Auth | findByEmail, existsByEmail | updateRole → `auth:*` | createWithUser → `auth:*` + `user:*` |
| Travel | findAll, findById, findByFilters | create, delete → `travel:*` | — |
| Inscription | findAll, findById, findByUserRefId, findByRouteRefId, existsByUserAndRoute, countByRouteRefId | create, delete → `inscription:*` | create/delete also → `travel:*` |

## Resilience

- **Redis down**: All cache operations are wrapped in try/catch. Failures log a warning and fall through to the database. The app never breaks because of cache unavailability.
- **Cache disabled**: Set `CACHE_ENABLED=false` — all decorators delegate directly to the inner Prisma repository with zero overhead.

## File Structure

```
src/
├── domain/services/
│   └── cache.service.ts              # CacheService interface
├── lib/errors/
│   └── cache.errors.ts               # CacheError, CacheConnectionError
├── lib/shared/di/
│   ├── tokens.ts                     # + CacheService, CacheConfig, PRISMA_TOKENS
│   └── container.ts                  # Rewired: PRISMA_TOKENS → Prisma, TOKENS → Cached
└── infrastructure/cache/
    ├── cache.config.ts               # CacheConfig type + defaults
    ├── cache.utils.ts                # cacheAside(), invalidatePatterns()
    ├── upstash-cache.service.ts      # Upstash implementation
    └── repositories/
        ├── cached-auth.repository.ts
        ├── cached-user.repository.ts
        ├── cached-driver.repository.ts
        ├── cached-city.repository.ts
        ├── cached-travel.repository.ts
        ├── cached-inscription.repository.ts
        ├── cached-car.repository.ts
        ├── cached-model.repository.ts
        ├── cached-brand.repository.ts
        └── cached-color.repository.ts
```

## Adding Caching to a New Repository

1. Add a symbol to `PRISMA_TOKENS` in `tokens.ts`
2. Create `cached-x.repository.ts` in `src/infrastructure/cache/repositories/`
   - Implement the repository interface
   - Inject `PRISMA_TOKENS.XRepository`, `TOKENS.CacheService`, `TOKENS.CacheConfig`
   - Use `cacheAside()` for reads, `invalidatePatterns()` after writes
3. Add TTL entry to `CacheTTLConfig` in `cache.config.ts`
4. In `container.ts`: register Prisma under `PRISMA_TOKENS`, Cached under `TOKENS`

## Testing

- **Existing tests**: Unaffected — they mock repositories directly, never touch cache
- **Mock factory**: `createMockCacheService()` in `tests/setup.ts` returns `vi.fn()` stubs with `get` defaulting to `null` (cache miss)
- **Cached repo tests**: Verify cache hit/miss/error fallthrough/invalidation per decorator
