# Test Coverage Audit — Covoiturage API

**Date**: 2026-02-18
**Scope**: Full audit of unit tests, integration tests, and E2E tests
**Goal**: Ensure comprehensive, meaningful test coverage — not testing for the sake of it

---

## Executive Summary

The project has **~73 unit test files, 8 integration test files, and 16 E2E test files** (~180+ total tests). Existing tests are **high quality** — they cover happy paths, error propagation, short-circuit behavior, and business rule enforcement.

However, **9 use cases have zero unit tests**, including the **most complex business logic in the app** (trip creation, trip deletion with ownership checks). There is also **1 bug in an existing test** that passes for the wrong reason.

| Category | Status |
|---|---|
| Schemas (validation) | Fully tested |
| Middleware (auth, authz, errors, logging) | Fully tested |
| Prisma repositories (10) | Fully tested |
| Cached repositories (10) | Fully tested |
| Infrastructure services (JWT, password, email, cache) | Fully tested |
| Core utilities (Result, pagination, error-registry, logger) | Fully tested |
| Auth use cases (register, login) | Fully tested |
| Inscription use cases (5) | Fully tested |
| Brand/car/city/color use cases | Fully tested |
| Driver use case | Fully tested |
| **Trip use cases (5)** | **NOT TESTED** |
| **User use cases (4 of 5)** | **NOT TESTED** |
| V1 controllers (8) | 7/8 tested (driver missing) |
| VP controllers (5) | Covered by E2E only |
| Integration routes (10 domains) | 8/10 tested (driver, color missing) |
| E2E tests (v1 + vp) | Comprehensive |

---

## 1. Missing Unit Tests — Critical Gaps

### 1.1 Trip Use Cases — ALL 5 MISSING (High Priority)

These are the **core feature** of the carpooling app and have **zero unit tests**.

| File | Complexity | What needs testing |
|------|-----------|-------------------|
| `src/application/use-cases/trip/create-trip.use-case.ts` | **High** | Driver resolution, car resolution, find-or-create cities (both exist / both new / mixed), repo error propagation at each of 6 async steps |
| `src/application/use-cases/trip/delete-trip.use-case.ts` | **High** | **Ownership check** (ForbiddenError when driver doesn't own trip), trip-not-found, driver-not-found, happy path deletion |
| `src/application/use-cases/trip/get-trip.use-case.ts` | Low | Happy path, TripNotFoundError, repo error |
| `src/application/use-cases/trip/find-trip.use-case.ts` | Low | Filter passthrough, date string-to-Date conversion, repo error |
| `src/application/use-cases/trip/list-trips.use-case.ts` | Low | Pagination meta building, default pagination params, repo error |

**Why this matters**:
- `CreateTripUseCase` has the most complex business logic in the app — 4 repository calls with a find-or-create pattern for cities. No test validates that cities are auto-created when missing.
- `DeleteTripUseCase` has a **security-critical ownership verification** (line 79: `driverRefId !== driverResult.value.refId`). No test validates that a driver cannot delete someone else's trip.

### 1.2 User Use Cases — 4 MISSING (Medium Priority)

| File | Complexity | What needs testing |
|------|-----------|-------------------|
| `src/application/use-cases/user/get-user.use-case.ts` | Low | Happy path, not-found, **anonymized user treated as not-found** |
| `src/application/use-cases/user/delete-user.use-case.ts` | Low | Happy path, not-found, **anonymized user treated as not-found**, repo error |
| `src/application/use-cases/user/update-user.use-case.ts` | Medium | Partial field mapping (only provided fields passed), anonymized = not-found, repo error |
| `src/application/use-cases/user/list-users.use-case.ts` | Low | Happy path, repo error |

**Why this matters**:
- The "anonymized user = not found" behavior is a **GDPR-critical rule** present in get, delete, and update use cases. No unit test validates this.
- `UpdateUserUseCase` has conditional field-building logic (`if (input.firstName) updateData.firstName = input.firstName`) — no test verifies that only provided fields are passed to the repository.

### 1.3 Driver Controller — MISSING (Low Priority)

`src/presentation/controllers/driver.controller.ts` has no corresponding `driver.controller.test.ts`. Only 1 function (`createDriver`), follows the same pattern as all other tested controllers.

### 1.4 VP Controllers — All 5 MISSING (Covered by E2E)

No VP controller has a unit test, but they are covered by **57 E2E tests**. These are thin wrappers around the same use cases as V1.

**Tech debt note**: `vpPatchTrip` in `src/presentation/vp/controllers/trip.controller.ts:92-107` **bypasses the use case layer** and directly calls `prisma.trip.update()`. This is architecturally inconsistent and has fragile raw Prisma error handling (`P2025` code check). Should ideally be refactored to use an `UpdateTripUseCase`.

---

## 2. Missing Integration Tests

| Missing file | Endpoints not covered |
|---|---|
| `tests/integration/driver.routes.test.ts` | `POST /api/v1/drivers` — driver creation, no-auth rejection, role verification |
| `tests/integration/color.routes.test.ts` | `GET/POST/PATCH/DELETE /api/v1/colors` — full CRUD operations |

---

## 3. Bugs & Quality Issues in Existing Tests

### 3.1 BUG: Wrong URL in inscription integration test

**File**: `tests/integration/inscription.routes.test.ts`, line 103

```typescript
// CURRENT (WRONG): missing /v1 prefix
const res = await app.request('/api/inscriptions', {
    method: 'POST',
    body: JSON.stringify(validBody),
    headers: authHeaders(),
});
expect(res.status).toBe(404);

// SHOULD BE:
const res = await app.request('/api/v1/inscriptions', { ... });
```

This test ("should return 404 when trip not found") hits a **non-existent route**, gets a 404 from the router, and passes **for the wrong reason**. It does NOT test the `TripNotFoundError` domain error path at all.

**Impact**: The `TripNotFoundError` → 404 mapping is untested at the integration level for inscriptions.

### 3.2 E2E validation tests use loose assertions

Several E2E tests for auth validation errors (weak password, empty body, mismatched passwords) only assert `res.ok() === false` instead of checking the exact status code.

**Files affected**:
- `e2e/tests/v1/auth.spec.ts`
- `e2e/tests/vp/auth.spec.ts`

The error handler middleware converts `ZodError` to **400**, but the tests would also pass if the server returned 500 (which would indicate a different problem). Tests should assert `expect(res.status()).toBe(400)` for meaningful validation.

### 3.3 VP vpPatchTrip bypasses Clean Architecture

`src/presentation/vp/controllers/trip.controller.ts:92-107`:

```typescript
// Direct Prisma call in a controller — bypasses use case layer
const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
const updated = await prisma.trip.update({ where: { id }, data });
```

This is the only controller that directly accesses the database, bypassing the repository and use case layers. The `P2025` error code handling is fragile (no type safety). Not a test issue per se, but it means this code path has no unit test coverage and can only be tested via E2E.

---

## 4. What's Already Well Tested

These areas have comprehensive, meaningful tests and need no additional coverage:

| Area | Test count | Quality |
|------|-----------|---------|
| Zod schemas (9 files) | ~40 tests | Validates both valid and invalid inputs |
| Middleware (4 files) | ~25 tests | Auth, authorization, error handling, logging |
| Prisma repositories (10 files) | ~50 tests | CRUD, filters, edge cases, error propagation |
| Cached repositories (10 files) | ~40 tests | Cache hit/miss, invalidation, fallback |
| Infrastructure services (4 files) | ~20 tests | JWT sign/verify, password hash/verify, email, cache |
| Core utilities (6 files) | ~30 tests | Result type, pagination, error registry, logger |
| Auth use cases (2 files) | ~14 tests | Registration flow, login flow, email failure tolerance |
| Inscription use cases (5 files) | ~20 tests | Create with seat checks, duplicate guard, delete, lists |
| Brand/car/city/color use cases | ~25 tests | CRUD with domain error paths |
| Driver use case (1 file) | 7 tests | Creation, role upgrade, duplicate guard |
| V1 controllers (7 files) | ~35 tests | All endpoints, validation, error mapping |
| E2E v1 tests (11 files) | ~61 tests | Full HTTP flow, auth, RBAC, CRUD |
| E2E vp tests (5 files) | ~57 tests | Full HTTP flow, cross-API checks |

---

## 5. Recommended Actions

### Priority 1 — Fix existing bug
1. Fix URL in `tests/integration/inscription.routes.test.ts:103` (`/api/inscriptions` -> `/api/v1/inscriptions`)

### Priority 2 — Add trip use case tests (highest value)
2. Create `src/application/use-cases/trip/create-trip.use-case.test.ts` (~7 tests)
3. Create `src/application/use-cases/trip/delete-trip.use-case.test.ts` (~6 tests)
4. Create `src/application/use-cases/trip/get-trip.use-case.test.ts` (~3 tests)
5. Create `src/application/use-cases/trip/find-trip.use-case.test.ts` (~4 tests)
6. Create `src/application/use-cases/trip/list-trips.use-case.test.ts` (~3 tests)

### Priority 3 — Add user use case tests
7. Create `src/application/use-cases/user/get-user.use-case.test.ts` (~4 tests)
8. Create `src/application/use-cases/user/delete-user.use-case.test.ts` (~4 tests)
9. Create `src/application/use-cases/user/update-user.use-case.test.ts` (~5 tests)
10. Create `src/application/use-cases/user/list-users.use-case.test.ts` (~2 tests)

### Priority 4 — Fill remaining gaps
11. Create `src/presentation/controllers/driver.controller.test.ts` (~3 tests)
12. Create `tests/integration/driver.routes.test.ts` (~4 tests)
13. Create `tests/integration/color.routes.test.ts` (~8 tests)

### Priority 5 — Tighten E2E assertions
14. Update `e2e/tests/v1/auth.spec.ts` — assert exact 400 status for validation errors
15. Update `e2e/tests/vp/auth.spec.ts` — assert exact 400 status for validation errors

---

## 6. Test Patterns to Follow

All new tests should follow the established patterns:

```typescript
// Use case test pattern (from create-inscription.use-case.test.ts)
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockXRepository, createMockLogger } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';

describe('XUseCase', () => {
    let useCase: XUseCase;
    let mockRepo: ReturnType<typeof createMockXRepository>;

    beforeEach(() => {
        mockRepo = createMockXRepository();
        container.registerInstance(TOKENS.XRepository, mockRepo);
        container.registerInstance(TOKENS.Logger, createMockLogger());
        useCase = container.resolve(XUseCase);
    });

    it('should handle happy path', async () => { ... });
    it('should return XNotFoundError when not found', async () => { ... });
    it('should propagate repository errors', async () => { ... });
});
```

Mock factories from `tests/setup.ts` already exist for all repositories and services.

---

## 7. Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| Use cases with tests | 22/31 (71%) | **31/31 (100%)** |
| Controllers with tests | 7/8 (88%) | **8/8 (100%)** |
| Integration test files | 8/10 (80%) | **10/10 (100%)** |
| Known test bugs | 1 | **0** |
| New test cases | — | **~53** |
