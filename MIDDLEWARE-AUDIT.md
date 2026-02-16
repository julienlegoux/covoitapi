# Middleware Audit — Separation of Concerns

This document details architectural concerns found across the four middleware files in `src/presentation/middleware/`. Each section describes the issue, where it occurs, why it matters, and what the fix looks like.

---

## 1. Service Locator Anti-Pattern (all middleware)

### What

Every middleware manually calls `container.resolve()` to obtain its dependencies at runtime, instead of receiving them through function parameters.

### Where

| File | Line(s) | Resolved dependency |
|---|---|---|
| `auth.middleware.ts` | 39, 59 | Logger, JwtService |
| `authorization.middleware.ts` | 51 | Logger |
| `error-handler.middleware.ts` | 84 | Logger |
| `request-logger.middleware.ts` | 40 | Logger |

### Why it matters

- **Hidden dependencies.** Reading the function signature reveals nothing about what the middleware actually needs. You have to scan the body to discover the implicit coupling to the DI container.
- **Testing friction.** Unit tests must either bootstrap the full container or mock `container.resolve` globally, instead of simply passing mock objects as arguments.
- **Violates Dependency Inversion.** The middleware depends on the concrete container (infrastructure detail) rather than on abstractions handed to it.

### Recommended fix

Use **factory functions** that accept dependencies explicitly and return the middleware closure. Call `container.resolve()` once, at the composition root (route setup), not inside the middleware itself.

```ts
// Before (service locator)
export async function authMiddleware(c: Context, next: Next) {
  const logger = container.resolve<Logger>(TOKENS.Logger);
  const jwtService = container.resolve<JwtService>(TOKENS.JwtService);
  // ...
}

// After (dependency injection via factory)
export function createAuthMiddleware(jwtService: JwtService, logger: Logger) {
  return async (c: Context, next: Next) => {
    // logger and jwtService are closed over — no container needed
  };
}

// At the composition root (route setup)
const authMiddleware = createAuthMiddleware(
  container.resolve(TOKENS.JwtService),
  container.resolve(TOKENS.Logger),
);
```

---

## 2. Domain Service Misplaced — `JwtService` in `domain/services/`

### What

The `JwtService` interface lives in `src/domain/services/jwt.service.ts`. JWT is a transport-level authentication mechanism, not a domain concept.

### Where

- Interface: `src/domain/services/jwt.service.ts`
- Implementation: `src/infrastructure/services/hono-jwt.service.ts`
- Consumer: `src/presentation/middleware/auth.middleware.ts` (lines 59-60)

### Why it matters

- **The domain never uses it.** No use case or domain entity calls `JwtService`. It is exclusively consumed by the presentation layer (the auth middleware).
- **Couples domain to auth strategy.** If the project switches from JWT to session-based auth, OAuth tokens, or API keys, the domain layer — which should be agnostic to delivery mechanisms — would need to change.
- **Breaks the Dependency Rule.** In Clean Architecture, the domain layer should have zero knowledge of HTTP, tokens, or transport concerns. An interface only belongs in the domain if domain logic depends on it.

### Recommended fix

Move `JwtService` to `src/infrastructure/services/` (next to its implementation) or to a dedicated `src/presentation/services/` directory. The presentation layer owns the auth flow; the interface should live where its consumers are.

---

## 3. Business Logic in Presentation — Role Hierarchy

### What

`authorization.middleware.ts` defines a `ROLE_HIERARCHY` map (lines 25-29) that encodes who outranks whom:

```ts
const ROLE_HIERARCHY: Record<string, number> = {
  USER: 1,
  DRIVER: 2,
  ADMIN: 3,
};
```

This is a **business rule** (which roles have which level of access) embedded directly in a presentation-layer file.

### Where

- `src/presentation/middleware/authorization.middleware.ts`, lines 25-29 and 65-66

### Why it matters

- **Business rule in the wrong layer.** If a new role is introduced or the hierarchy changes, the edit happens in a middleware file rather than in the domain where authorization policy belongs.
- **Not reusable.** Other parts of the application that need to check role levels (e.g., a use case that restricts certain operations) cannot reference this map without importing from the presentation layer, which inverts the dependency direction.

### Recommended fix

Extract the role hierarchy into the domain layer (e.g., `src/domain/authorization/role-hierarchy.ts`). The middleware should receive or import it, but the definition should live in the domain. Alternatively, pass the hierarchy into the `requireRole` factory:

```ts
export function createRequireRole(hierarchy: Record<string, number>, logger: Logger) {
  return (...roles: string[]) => {
    return async (c: Context, next: Next) => {
      // uses hierarchy and logger from closure
    };
  };
}
```

---

## 4. Tight Coupling to Domain Error Types in Error Handler

### What

`error-handler.middleware.ts` directly checks `instanceof DomainError` (line 74) and reads `.code` to map errors to HTTP status codes.

### Where

- `src/presentation/middleware/error-handler.middleware.ts`, lines 74-82 (DomainError branch) and lines 54-71 (ZodError branch)

### Why it matters

- **Every new error category requires editing the middleware.** If a new error base class is introduced, the `buildErrorResponse` and `getStatusCode` functions must be updated.
- **Acceptable trade-off, but worth noting.** An error handler at the application boundary inherently needs *some* knowledge of error types. This is the least severe issue, but could be improved with a more generic mapping strategy (e.g., errors self-describe their HTTP status via an interface).

### Recommended fix (optional)

Have domain errors implement a common interface that carries its own suggested status code, or use the existing error registry more generically so the handler doesn't need `instanceof` branching:

```ts
interface HttpMappableError {
  code: string;
  message: string;
}

// The handler only needs to check one interface, not N error classes
```

---

## 5. Duplicated Default Role

### What

The role defaults to `'USER'` in two places:

1. `auth.middleware.ts`, line 64: `c.set('role', result.value.role ?? 'USER')`
2. `hono-jwt.service.ts`, line 99: `role: (decoded.role as string) ?? 'USER'`

### Where

- `src/presentation/middleware/auth.middleware.ts:64`
- `src/infrastructure/services/hono-jwt.service.ts:99`

### Why it matters

- **One of these is dead code.** Since `HonoJwtService.verify` already defaults to `'USER'`, the middleware fallback never triggers. If the intended default changes, updating only one location would silently leave the other stale.
- **Single source of truth.** The default role should be defined in exactly one place — ideally where the token payload is decoded (`JwtService` implementation), not at the middleware level.

### Recommended fix

Remove the `?? 'USER'` fallback from the middleware. Trust the `JwtService` contract to always return a role.

---

## Summary Table

| # | Issue | Severity | Files affected |
|---|---|---|---|
| 1 | Service locator (`container.resolve` in middleware) | High | All 4 middleware |
| 2 | `JwtService` interface in domain layer | Medium | `domain/services/`, `auth.middleware` |
| 3 | Role hierarchy business logic in presentation | Medium | `authorization.middleware` |
| 4 | `instanceof` branching on domain error types | Low | `error-handler.middleware` |
| 5 | Duplicated default role (`'USER'`) | Low | `auth.middleware`, `hono-jwt.service` |

---

## Flow Visualization — `POST /api/cars` (Create Car)

The Car entity is a protected CRUD resource that passes through every layer and both middleware. Below is the current flow with its issues annotated, followed by the ideal flow after fixing them.

### Current Flow

```
POST /api/cars  { model, brandId, licensePlate }
Header: x-auth-token: <jwt>

═══════════════════════════════════════════════════════════════════
 PRESENTATION LAYER
═══════════════════════════════════════════════════════════════════

  car.routes.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ carRoutes.use('*', authMiddleware)                         │
  │ carRoutes.post('/', requireRole('DRIVER'), createCar)      │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  auth.middleware.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠ container.resolve(Logger)          ← service locator     │
  │ ⚠ container.resolve(JwtService)      ← service locator     │
  │                                                             │
  │ token = c.req.header('x-auth-token')                       │
  │ result = jwtService.verify(token)                          │
  │                        │                                    │
  │                        ▼                                    │
  │              ┌─ domain/services/jwt.service.ts ────┐        │
  │              │ ⚠ interface lives in DOMAIN         │        │
  │              │   but only presentation uses it     │        │
  │              └─────────────────────────────────────┘        │
  │                                                             │
  │ c.set('userId', result.value.userId)                       │
  │ c.set('role', result.value.role ?? 'USER')                 │
  │                                    ⚠ duplicated default    │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  authorization.middleware.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠ container.resolve(Logger)          ← service locator     │
  │                                                             │
  │ ⚠ ROLE_HIERARCHY = { USER:1, DRIVER:2, ADMIN:3 }          │
  │   ↑ business rule defined in presentation layer            │
  │                                                             │
  │ userLevel = ROLE_HIERARCHY[c.get('role')]                   │
  │ minRequired = ROLE_HIERARCHY['DRIVER']                      │
  │ userLevel >= minRequired? → next()                          │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  car.controller.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ body = c.req.json()                                        │
  │ validated = createCarSchema.parse(body)   ← Zod validation │
  │ input = { ...validated, userId: c.get('userId') }          │
  │                                                             │
  │ ⚠ container.resolve(CreateCarUseCase) ← service locator    │
  │                                                             │
  │ result = useCase.execute(input)                            │
  │ return resultToResponse(c, result, 201)                    │
  └──────────────┬──────────────────────────────────────────────┘
                 │
═════════════════╪═════════════════════════════════════════════════
 APPLICATION LAYER (Use Cases)
═════════════════╪═════════════════════════════════════════════════
                 │
                 ▼
  create-car.use-case.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ Dependencies injected via @inject (constructor DI ✓)       │
  │   CarRepo, ModelRepo, BrandRepo, UserRepo, DriverRepo     │
  │                                                             │
  │ 1. userRepo.findById(userId)        → UUID → UserEntity    │
  │ 2. driverRepo.findByUserRefId(                             │
  │        user.refId)                  → int FK → DriverEntity│
  │ 3. carRepo.existsByLicensePlate(                           │
  │        input.licensePlate)          → uniqueness check     │
  │ 4. brandRepo.findById(brandId)      → UUID → BrandEntity   │
  │ 5. modelRepo.findByNameAndBrand(                           │
  │        input.model, brand.refId)    → find or create       │
  │ 6. carRepo.create({                                        │
  │        licensePlate, modelRefId,                            │
  │        driverRefId })               → int FKs              │
  │                                                             │
  │ return ok(CarEntity) or err(CreateCarError)                │
  └──────────────┬──────────────────────────────────────────────┘
                 │
═════════════════╪═════════════════════════════════════════════════
 DOMAIN LAYER (Interfaces only — no implementation)
═════════════════╪═════════════════════════════════════════════════
                 │
                 ▼
  domain/repositories/car.repository.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ interface CarRepository {                                   │
  │   findAll(params?) → Result<{ data, total }, RepoError>    │
  │   findById(id)     → Result<CarEntity | null, RepoError>   │
  │   create(data)     → Result<CarEntity, RepoError>          │
  │   update(id, data) → Result<CarEntity, RepoError>          │
  │   delete(id)       → Result<void, RepoError>               │
  │   existsByLicensePlate(lp) → Result<boolean, RepoError>    │
  │ }                                                           │
  └──────────────┬──────────────────────────────────────────────┘
                 │
  domain/entities/car.entity.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ CarEntity = {                                               │
  │   id: string           ← UUID (API-facing)                 │
  │   refId: number        ← int (internal FK)                 │
  │   licensePlate: string                                      │
  │   modelRefId: number   ← FK → Model                       │
  │   driverRefId: number  ← FK → Driver                      │
  │ }                                                           │
  └──────────────┬──────────────────────────────────────────────┘
                 │
═════════════════╪═════════════════════════════════════════════════
 INFRASTRUCTURE LAYER (Implementations)
═════════════════╪═════════════════════════════════════════════════
                 │
                 ▼
  cached-car.repository.ts  (TOKENS.CarRepository)
  ┌─────────────────────────────────────────────────────────────┐
  │ Decorator: wraps inner PrismaCarRepository                  │
  │                                                             │
  │ READ:  cache-aside (check cache → miss → DB → store)       │
  │ WRITE: delegate to inner → invalidate car:* on success     │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  prisma-car.repository.ts  (PRISMA_TOKENS.CarRepository)
  ┌─────────────────────────────────────────────────────────────┐
  │ prisma.car.create({                                        │
  │   data: {                                                   │
  │     immat: data.licensePlate,  ← field mapping             │
  │     modelRefId,                                             │
  │     driverRefId,                                            │
  │   }                                                         │
  │ })                                                          │
  │                                                             │
  │ toEntity(): immat → licensePlate   ← schema abstraction    │
  │ return ok(CarEntity)                                        │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
             PostgreSQL
```

### Ideal Flow (after fixes)

```
POST /api/cars  { model, brandId, licensePlate }
Header: x-auth-token: <jwt>

═══════════════════════════════════════════════════════════════════
 COMPOSITION ROOT (one-time setup, only place container is used)
═══════════════════════════════════════════════════════════════════

  route-factory.ts or app setup
  ┌─────────────────────────────────────────────────────────────┐
  │ const logger = container.resolve(TOKENS.Logger)             │
  │ const jwtService = container.resolve(TOKENS.JwtService)     │
  │ const roleHierarchy = container.resolve(TOKENS.RoleHierarchy│
  │                                                             │
  │ const authMiddleware = createAuthMiddleware(jwtService,      │
  │                                            logger)          │
  │ const requireRole = createRequireRole(roleHierarchy, logger)│
  │ const carController = createCarController(container)        │
  │                                                             │
  │ All container.resolve() calls happen HERE and ONLY here.    │
  └──────────────┬──────────────────────────────────────────────┘
                 │
═══════════════════════════════════════════════════════════════════
 PRESENTATION LAYER (no container imports anywhere)
═══════════════════════════════════════════════════════════════════
                 │
                 ▼
  car.routes.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ carRoutes.use('*', authMiddleware)      ← injected instance │
  │ carRoutes.post('/', requireRole('DRIVER'), carController.   │
  │                                            create)          │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  auth.middleware.ts  (factory-based)
  ┌─────────────────────────────────────────────────────────────┐
  │ createAuthMiddleware(jwtService, logger) {                  │
  │   return async (c, next) => {                               │
  │     ✓ jwtService closed over — no container needed          │
  │     ✓ logger closed over — no container needed              │
  │                                                             │
  │     token = c.req.header('x-auth-token')                   │
  │     result = jwtService.verify(token)                      │
  │                        │                                    │
  │                        ▼                                    │
  │              ┌─ infrastructure/services/jwt.service.ts ─┐   │
  │              │ ✓ interface lives in INFRASTRUCTURE      │   │
  │              │   next to its implementation              │   │
  │              └──────────────────────────────────────────┘   │
  │                                                             │
  │     c.set('userId', result.value.userId)                   │
  │     c.set('role', result.value.role)                       │
  │                       ✓ no duplicate default                │
  │   }                                                         │
  │ }                                                           │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  authorization.middleware.ts  (factory-based)
  ┌─────────────────────────────────────────────────────────────┐
  │ createRequireRole(roleHierarchy, logger) {                  │
  │   return (...roles) => async (c, next) => {                 │
  │     ✓ roleHierarchy comes from DOMAIN, injected here       │
  │     ✓ logger closed over — no container needed              │
  │                                                             │
  │     userLevel = roleHierarchy[c.get('role')]                │
  │     minRequired = min(roles.map(r => roleHierarchy[r]))     │
  │     userLevel >= minRequired? → next()                      │
  │   }                                                         │
  │ }                                                           │
  └──────────────┬──────────────────────────────────────────────┘
                 │
                 ▼
  car.controller.ts
  ┌─────────────────────────────────────────────────────────────┐
  │ ✓ Use case injected or resolved via factory                │
  │                                                             │
  │ body = c.req.json()                                        │
  │ validated = createCarSchema.parse(body)                    │
  │ input = { ...validated, userId: c.get('userId') }          │
  │ result = useCase.execute(input)                            │
  │ return resultToResponse(c, result, 201)                    │
  └──────────────┬──────────────────────────────────────────────┘
                 │
═════════════════╪═════════════════════════════════════════════════
 APPLICATION + DOMAIN + INFRASTRUCTURE  (unchanged — already clean)
═════════════════╪═════════════════════════════════════════════════
                 │
                 ▼
            (same as current flow — use case → domain
             interface → cached repo → prisma repo → DB)
```

### What changed — side by side

| Concern | Current | Ideal |
|---|---|---|
| **Where `container.resolve` lives** | Inside every middleware and controller | Composition root only |
| **Middleware dependencies** | Hidden (pulled from global container) | Explicit (received via factory args) |
| **`JwtService` interface location** | `domain/services/` | `infrastructure/services/` |
| **Role hierarchy definition** | `authorization.middleware.ts` (presentation) | `domain/authorization/` (domain, injected into middleware) |
| **Default role `'USER'`** | Duplicated in middleware + jwt service | Single source in jwt service |
| **Testing a middleware** | Mock `container.resolve` globally | Pass mocks directly as factory args |
| **Adding a new role** | Edit a middleware file | Edit domain config, middleware untouched |
| **Switching from JWT to sessions** | Edit domain layer (`JwtService` interface) | Edit infrastructure + presentation only, domain untouched |
