# Test Suite Analysis Report

## Overview

| Metric | Value |
|--------|-------|
| Test files | 70 |
| Total tests | 506 |
| Passing | 506 (100%) |
| Failing | 0 |

---

## Test Inventory by Layer

| Layer | Files | Tests | Status |
|-------|-------|-------|--------|
| Use Cases (unit) | 33 | ~135 | All use cases covered |
| Controllers (unit) | 8 | ~63 | 8/9 controllers covered |
| Validators (unit) | 8 | ~84 | 8/9 validators covered |
| Middleware (unit) | 3 | ~31 | 3/4 middleware covered |
| Infrastructure services | 3 | ~30 | 3/3 services covered |
| Infrastructure repositories | 1 | ~6 | **1/11 repositories covered** |
| Shared/lib (unit) | 6 | ~100 | Core utilities covered |
| Integration (routes) | 8 | ~59 | All route groups covered |

---

## Strengths

- **Use case tests mock at the repository boundary** — business logic is tested in isolation with proper DI container setup/teardown per test
- **Error propagation tests** are present on most complex use cases (inscription, travel, car) — DB errors bubble up correctly
- **Auth middleware** covers all JWT error variants: expired, invalid, malformed, missing token
- **Authorization middleware** tests cover role hierarchy correctly
- **Validator tests** are thorough — `auth.validator.test.ts` tests email formats, password strength rules, confirmation matching
- **Integration tests use `app.request()`** exercising the full middleware chain (auth → authorization → error handling → validation → controller)
- **Result type utility** has 41 tests covering the full monadic API

---

## Quality Issues in Existing Tests

### Weak "Invalid Input" Integration Tests

Seven integration tests assert invalid input with only `expect(res.ok).toBe(false)` — no status code, no error code, no error body. They prove the request fails but not **how** it fails.

| File | Test |
|------|------|
| `tests/integration/auth.routes.test.ts` | `should reject invalid input` (register) |
| `tests/integration/auth.routes.test.ts` | `should reject missing fields` (login) |
| `tests/integration/brand.routes.test.ts` | `should reject invalid input` |
| `tests/integration/car.routes.test.ts` | `should reject invalid input` |
| `tests/integration/city.routes.test.ts` | `should reject invalid input` |
| `tests/integration/inscription.routes.test.ts` | `should reject invalid input` |
| `tests/integration/travel.routes.test.ts` | `should reject invalid input` |

**Recommendation:** Assert `expect(res.status).toBe(400)` and validate `body.error.code === 'VALIDATION_ERROR'`.

### RegisterUseCase — Only 2 Tests for 6 Failure Paths

`register.use-case.ts` has 6 distinct paths but `register.use-case.test.ts` only tests 2:

| Path | Tested? |
|------|---------|
| Email already exists | Yes |
| Successful registration | Yes |
| `existsByEmail` DB error | **No** |
| `passwordService.hash` error | **No** |
| `authRepository.createWithUser` error | **No** |
| `jwtService.sign` error | **No** |
| `emailService.sendWelcomeEmail` failure (non-blocking, logs warning) | **No** |

By contrast, `create-inscription.use-case.test.ts` has 8 tests covering all error paths — the register test should follow that pattern.

### LoginUseCase — Only 3 Tests

Missing error propagation for:
- `authRepository.findByEmail` DB error
- `passwordService.verify` error
- `jwtService.sign` error

### Integration Tests Don't Verify Response Bodies on Create

Most POST integration tests check `res.status === 201` but never assert the response body. Examples:
- `travel.routes.test.ts:87` — checks status, ignores data
- `car.routes.test.ts` — same pattern
- `inscription.routes.test.ts:80` — same pattern

---

## Coverage Gaps — Prioritized by Business Risk

### Priority 1: Repository Tests (11 untested)

Only `prisma-user.repository.ts` has tests. These are the DB interaction layer where production bugs most often occur.

| Repository | Risk | Key Logic to Test |
|-----------|------|-------------------|
| `prisma-auth.repository` | **Critical** | `createWithUser` transaction (creates auth + user atomically) |
| `prisma-travel.repository` | **Critical** | `findByFilters` (dynamic WHERE with city + date), `create` (CityTravel junction records) |
| `prisma-inscription.repository` | **High** | `existsByUserAndRoute`, `countByRouteRefId` (seat availability) |
| `prisma-car.repository` | **High** | `existsByImmat` (uniqueness check) |
| `prisma-driver.repository` | **Medium** | `findByUserRefId` |
| `prisma-city.repository` | **Medium** | `findByCityName` (used in travel creation) |
| `prisma-model.repository` | **Medium** | `findByNameAndBrand` (composite lookup) |
| `prisma-brand.repository` | **Low** | Simple CRUD |
| `prisma-color.repository` | **Low** | Simple CRUD |

**Note:** `createMockPrismaClient()` in `tests/setup.ts` only stubs `user` and `auth` models — it must be extended before writing these tests.

### Priority 2: Auth Use Case Error Path Tests

- `register.use-case.test.ts` — add 5 tests for error propagation + email failure logging
- `login.use-case.test.ts` — add 3-4 tests for error propagation

### Priority 3: Missing Test Files

| Missing File | What's Untested |
|-------------|-----------------|
| `driver.validator.test.ts` | Driver license validation rules |
| `request-logger.middleware.test.ts` | Request ID generation, timing, log output |

### Priority 4: Strengthen Integration Test Assertions

Upgrade the 7 weak `expect(res.ok).toBe(false)` assertions to proper status code + error body checks.

---

## Recommended Action Plan

### Step 1 — Fix Existing Test Quality
- Replace 7 weak `res.ok` assertions with `res.status` + body checks in integration tests
- Add 5 error path tests to `register.use-case.test.ts`
- Add 4 error path tests to `login.use-case.test.ts`

### Step 2 — Add Missing Test Files
- Create `driver.validator.test.ts`
- Create `request-logger.middleware.test.ts`

### Step 3 — Repository Tests (biggest coverage gain)
- Extend `createMockPrismaClient()` to cover all Prisma models
- Write tests in priority order: auth → travel → inscription → car → driver → city → model → brand → color

### Step 4 — Cleanup (optional)
- Remove deprecated `use-cases/route/` duplicate test files (they duplicate `use-cases/travel/`)
- Align remaining `Route` naming to `Travel` in test descriptions
