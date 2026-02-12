# CovoitAPI - Full Code Audit Report

## Overall Rating: 7.5 / 10 (Solid Junior-to-Mid Level)

This is an impressively well-structured project for its stage. The clean architecture, Result type pattern, DI container, and comprehensive error registry show strong engineering intent. Below are findings organized by severity and category.

---

## ARCHITECTURE & DESIGN (8/10)

### What's Done Well
- **Clean Architecture** with proper layer separation (domain / application / infrastructure / presentation)
- **Result\<T, E\> monad** for railway-oriented error handling — avoids throw/catch chaos
- **DI via TSyringe** with symbol-based tokens — proper inversion of control
- **Centralized error registry** mapping domain codes to HTTP statuses
- **Structured logging** with request context via AsyncLocalStorage

### What Needs Improvement

**1. Entity/Prisma type mismatch — `as unknown as` casting (HIGH)**
- File: `src/infrastructure/database/repositories/prisma-route.repository.ts` lines 26, 43, 84
- File: `src/infrastructure/database/repositories/prisma-inscription.repository.ts` lines 22, 34, 46, 58
- `return ok(routes as unknown as RouteEntity[])` — double-casting destroys type safety
- Root cause: domain entities are flat types with only scalar fields, but Prisma queries use `include` to return nested relations (driver, car, cities). The shapes don't match.
- **Fix**: Create proper domain entity types that include relations, or map Prisma results to domain entities explicitly in the repository.

**2. Anemic domain entities**
- All entities in `src/domain/entities/` are plain type aliases — no behavior, no validation, no invariant enforcement
- Example: `route.entity.ts` is just `{ id, dateRoute, kms, seats, driverId, carId }` — no method to check `hasAvailableSeats()`, no factory method
- In clean architecture, entities should encapsulate business rules. Currently all logic lives in use cases.
- **Recommendation**: Not critical at this scale, but as the domain grows, push invariants into entities.

**3. Flat route mounting**
- File: `src/presentation/routes/index.ts` lines 21-27 — 7 route modules mounted at `app.route('/', ...)` instead of RESTful grouping
- Results in URLs like `/api/listBrands`, `/api/brand`, `/api/listCars` rather than `/api/brands`, `/api/brands/:id`
- **Recommendation**: Group under RESTful resource paths (`/api/brands`, `/api/cars`, `/api/routes`, etc.)

---

## UNUSED CODE & DEAD FEATURES

### Utility Functions (completely unused)
| File | Line(s) | Export | Status |
|------|---------|--------|--------|
| `src/lib/shared/utils/response.util.ts` | 5 | `successResponse()` | Never imported anywhere |
| `src/lib/shared/utils/response.util.ts` | 13 | `errorResponse()` | Never imported anywhere |
| `src/presentation/middleware/request-logger.middleware.ts` | 6 | `requestLogger()` | Defined but never mounted in any route |

### Request Context helpers (all unused)
| File | Line(s) | Export | Status |
|------|---------|--------|--------|
| `src/lib/context/request-context.ts` | 33-36 | `getContextSafe()` | Never called |
| `src/lib/context/request-context.ts` | 38-40 | `getRequestId()` | Never called |
| `src/lib/context/request-context.ts` | 42-44 | `getUserId()` | Never called |
| `src/lib/context/request-context.ts` | 53-55 | `setUserId()` | Never called |
| `src/lib/context/request-context.ts` | 65-68 | `runWithContextSync()` | Never called |

### Application Error Classes (never instantiated)
| File | Line(s) | Export | Status |
|------|---------|--------|--------|
| `src/application/errors/application.errors.ts` | 11-18 | `ValidationError` | Exported but never thrown |
| `src/application/errors/application.errors.ts` | 21-25 | `NotFoundError` | Exported but never thrown |

### ColorRepository (full dead feature)
- `src/lib/shared/di/tokens.ts` line 4 — token defined, never injected
- `src/lib/shared/di/container.ts` line 33 — registered in DI, never resolved
- `src/infrastructure/database/repositories/prisma-color.repository.ts` — full implementation, never used
- `src/domain/repositories/color.repository.ts` — interface defined, never referenced
- No routes, controllers, or use cases exist for colors

### Two different logger implementations
- `src/lib/shared/utils/logger.util.ts` — simple console wrapper
- `src/infrastructure/logging/logger.ts` — structured logger with formatters
- Both are used in different parts of the codebase — should standardize on one

---

## SECURITY (6/10)

> Note: CORS and other transport-level protections are acknowledged as not yet implemented and excluded from scoring.

### Issues Found

**4. No authorization — only authentication (CRITICAL)**
- The `authMiddleware` verifies the JWT and sets `userId` in context, but **no endpoint checks if the authenticated user is authorized** to perform the action.
- Examples of what any authenticated user can do right now:
  - `DELETE /brand/:id` — delete any brand
  - `DELETE /person/:id` — delete any user
  - `GET /listPersons` — see all users' data
  - `PUT /person/:idpers` — update any user's profile
  - `DELETE /route/:id` — delete any route
  - Create inscriptions for other users (`idpers` is passed in the body, not from the JWT)
- **Fix**: Endpoints that act on "the current user" should use `c.get('userId')` from the JWT, not accept `idpers` from the body. Admin-only operations need role-based checks.

**5. `userId` from JWT is ignored — user ID comes from request body (CRITICAL)**
- `src/presentation/controllers/inscription.controller.ts` line 36: `idpers: validated.idpers` — the user ID comes from the POST body
- `src/presentation/controllers/route.controller.ts` line 43: `idpers: validated.idpers` — same issue
- This means User A can create routes or inscriptions on behalf of User B.
- **Fix**: For user-scoped actions, always use `c.get('userId')` set by the auth middleware.

**6. JWT `userId` cast without validation**
- `src/infrastructure/services/hono-jwt.service.ts` line 40: `return ok({ userId: decoded.userId as string })`
- If the token payload doesn't have `userId` or it's not a string, this silently passes `undefined`.
- **Fix**: Validate the decoded payload shape before returning.

**7. No rate limiting**
- No rate limiting on `/auth/login` or `/auth/register` — vulnerable to brute-force and credential stuffing attacks.
- Hono has `hono/rate-limiter` or you can use a simple in-memory/Redis limiter.

**8. No input size limits**
- `c.req.json()` is called without body size limits. An attacker could send a very large JSON payload.
- **Fix**: Add body size limit middleware.

**9. Password exposed in Person flow**
- `POST /person` accepts `password` in the body and hashes it — this is essentially a duplicate registration endpoint without email verification.
- If `POST /person` is meant for admin use, it should be protected differently. If it's for self-registration, it duplicates `/auth/register`.

---

## NAMING & CONSISTENCY (5/10)

**10. French/English naming mix throughout**
- Validators: `nom`, `prenom`, `tel`, `ville`, `villeD`, `villeA`, `dateT`, `idpers`, `idtrajet`, `cp`, `permis`, `modele`, `marqueId`, `immatriculation`
- DTOs: `CreateRouteInput.villeD`, `CreateInscriptionInput.idpers`
- Routes: `/listBrands`, `/listePostalsCodes` (typo: "liste" vs "list"), `/listInscriptionsUsers/:idpers`
- **Impact**: Makes the codebase harder to onboard to and creates a mental translation layer. The internal domain (entities, repos) uses English, but the API surface and validation use French.
- **Recommendation**: Pick one language. Ideally the API is English (international standard) with French only in user-facing labels. Map French external names to English internals in validators/controllers.

**11. Inconsistent URL parameter names**
- Person: `GET /person/:id` vs `PUT /person/:idpers` vs `PATCH /person/:idpers` vs `DELETE /person/:id`
- Inscription: `:id`, `:idpers`, `:idtrajet` — three different naming schemes
- **Fix**: Standardize to `:id` everywhere, use resource nesting for context.

**12. Non-RESTful route naming**
- `/listBrands` instead of `GET /brands`
- `/listePostalsCodes` instead of `GET /cities`
- `/listInscriptionsUsers/:idpers` instead of `GET /users/:id/inscriptions`
- REST convention: resource names are nouns, HTTP method implies the action.

---

## CODE QUALITY (7.5/10)

**13. Duplicate registration logic**
- `POST /auth/register` (RegisterUseCase) and `POST /person` (CreatePersonUseCase) both create users with hashed passwords.
- The Person endpoint skips email sending and JWT generation, but creates a user the same way.
- **Risk**: Divergent validation rules between the two paths. Person validator requires only 8-char password; Auth validator requires uppercase + lowercase + digit.

**14. No pagination on list endpoints**
- `listBrands`, `listPersons`, `listCars`, `listRoutes`, `listInscriptions` all call `findAll()` with no limit.
- **Risk**: As data grows, these endpoints will return unbounded datasets. This is a performance and memory concern, especially on Vercel serverless.
- **Fix**: Add `limit/offset` or cursor-based pagination.

**15. Missing query parameter validation on `findRoute`**
- `src/presentation/controllers/route.controller.ts` lines 26-30: Query params `villeD`, `villeA`, `dateT` are read directly from `c.req.query()` with no validation.
- All other endpoints validate input with Zod schemas, but this one skips validation.
- **Fix**: Add a Zod schema for query params.

**16. Date handling lacks timezone awareness**
- `src/infrastructure/database/repositories/prisma-route.repository.ts` lines 65-73: `new Date(filters.date)` uses local timezone, then `setHours(0, 0, 0, 0)`.
- On Vercel serverless (UTC), this behaves differently than local dev.
- `dateT` is validated as `z.string().min(1)` — no date format validation at all.
- **Fix**: Validate date format in the Zod schema (e.g., ISO 8601). Use UTC explicitly.

**17. Route filter logic bug**
- `src/infrastructure/database/repositories/prisma-route.repository.ts` lines 53-62: The filter uses `in: [departureCity, arrivalCity].filter(Boolean)` on the same `cityName` field.
- This finds routes that have **either** city in their stops — it doesn't distinguish departure from arrival.
- The CityRoute join table has no `order` or `type` column to differentiate departure vs. arrival.
- **Fix**: Add a `type` or `position` column to `CityRoute` to distinguish departure/arrival.

**18. `container.resolve()` called in every controller function**
- Every controller function calls `container.resolve(SomeUseCase)` inline. This works but:
  - Creates a new use case instance per request (TSyringe default is transient)
  - Could be optimized with singleton registration for stateless use cases
  - Makes controllers harder to test in isolation (tight coupling to the container)

**19. Empty zipcode on auto-created cities**
- `src/application/use-cases/route/create-route.use-case.ts` line 66
- Cities created during route creation get `zipcode: ''` — should validate or require zipcode input.

---

## TESTING (7/10)

### What's Done Well
- 51 test files with co-located unit tests
- Comprehensive mock factory in `tests/setup.ts`
- Result type has 50+ test cases
- Validators thoroughly tested with edge cases
- Integration tests for all route groups

### What Needs Improvement

**20. No test coverage reporting configured**
- `vitest.config.ts` has `coverage: { provider: 'v8' }` but no `thresholds` or CI integration.
- **Recommendation**: Add coverage thresholds (e.g., 80% for branches/lines).

**21. Integration tests use mocks — not real DB**
- `tests/integration/*.test.ts` mock the DI container rather than using a test database.
- These are effectively "thick unit tests", not true integration tests.
- **Recommendation**: Add a docker-compose test database for true integration tests, or use Prisma's test utilities.

**22. Missing test for driver use case**
- `create-driver.use-case.ts` has no `.test.ts` file — the only use case without tests.

**23. No E2E or contract tests**
- No test verifies the full HTTP request/response cycle with a real server.
- The Postman collection exists but isn't automated.

---

## DATABASE DESIGN (7/10)

**24. CityRoute lacks departure/arrival distinction**
- As mentioned in #17, the join table `CityRoute(routeId, cityId)` has no way to know which city is the departure and which is the arrival.
- This makes the `findRoute` filter unreliable.
- **Fix**: Add a `type` enum column (`'departure' | 'arrival' | 'stop'`) or an `order` integer.

**25. Cascade deletes are aggressive**
- Deleting a Brand cascades to Model -> Car -> (blocked by Route Restrict, which was changed to Cascade)
- Deleting a User cascades to Driver -> Routes -> Inscriptions
- This means deleting a Brand can wipe out associated routes and inscriptions.
- **Recommendation**: Use soft deletes for critical entities (User, Route) or restrict cascades.

**26. No indexes beyond unique constraints**
- No composite indexes for common query patterns (e.g., `Route.dateRoute` + city filters).
- The `findByFilters` query would benefit from an index on `dateRoute`.

**27. No `updatedAt` on most entities**
- Only `User` has `updatedAt`. Car, Route, Brand, City, etc. have no audit trail.

---

## API DESIGN (6/10)

**28. API versioning** ~~FIXED~~
- Base path is `/api/v1` — versioned routes allow future evolution without breaking clients.

**29. Delete endpoints return 200 with data instead of 204**
- REST convention: `DELETE` returns `204 No Content`. Current implementation returns `200` with `{ success: true, data: undefined }`.

**30. No OpenAPI/Swagger documentation**
- The Postman collection exists, but no machine-readable API spec.
- Hono supports `@hono/zod-openapi` which could auto-generate docs from existing Zod schemas.

**31. Health endpoint is inside the error handler middleware**
- If the error handler itself throws, the health check fails. Health checks should be as lightweight as possible.

---

## INFRASTRUCTURE & DEVOPS (7.5/10)

**32. Environment variables well managed**
- `.env` and `.env.local` are properly gitignored. `.env.example` provides a clear template for required variables.
- Environment validation exists at startup (DATABASE_URL, JWT_SECRET throw if missing).

**33. No CI/CD pipeline visible**
- No `.github/workflows/` files found. Tests and linting are only run manually.
- **Recommendation**: Add a GitHub Actions workflow for: lint, test, build, deploy.

**34. Prisma client generated into source tree**
- `src/infrastructure/database/generated/` contains the auto-generated Prisma client committed to git.
- This adds noise to diffs and can cause merge conflicts.
- **Recommendation**: Add `generated/` to `.gitignore` and generate at build time.

**35. DI container migration is complete**
- Old `src/infrastructure/di/container.ts` deleted, all imports updated to new path `src/lib/shared/di/container.ts`.
- No stray references to old path found.

**36. All npm dependencies are used** — no unused packages found.

---

## SUMMARY TABLE

| Category | Rating | Key Issues |
|---|---|---|
| Architecture & Design | 8/10 | Type casting, anemic entities |
| Unused Code | — | 12 unused exports, 1 dead feature (ColorRepository) |
| Security | 6/10 | No authorization, userId from body |
| Naming & Consistency | 5/10 | French/English mix, non-RESTful URLs |
| Code Quality | 7.5/10 | Duplicate registration, no pagination, date bugs |
| Testing | 7/10 | No real integration tests, missing coverage thresholds |
| Database Design | 7/10 | CityRoute missing type, aggressive cascades |
| API Design | 6/10 | No versioning, non-RESTful patterns |
| Infrastructure | 7.5/10 | No CI/CD, generated files in repo |

---

## PRIORITY FIX ORDER

1. **Authorization + userId from JWT** (#4, #5) — security-critical
2. **Route filter logic + CityRoute schema** (#17, #24) — data correctness
3. **Remove unused code** (unused functions, ColorRepository, dead error classes) — code hygiene
4. **Add pagination** (#14) — scalability
5. **Validate findRoute query params + dates** (#15, #16) — input safety
6. **Standardize naming to English + RESTful URLs** (#10, #11, #12) — DX & maintainability
7. **Remove duplicate person/register flow** (#13) — code clarity
8. **Fix Prisma-to-entity type mapping** (#1) — type safety
9. **Add CI/CD + coverage thresholds** (#20, #33) — process quality
10. **Standardize on one logger** — consistency
