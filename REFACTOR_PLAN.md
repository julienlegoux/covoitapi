# Refactor DTOs to Use Zod Schemas as Single Source of Truth

## Context

The current architecture duplicates type definitions between DTOs (`src/application/dtos/`) and Zod validator schemas (`src/presentation/validators/`). This creates maintenance burden and potential for drift between validation rules and type definitions.

**Problem:**
- 8 DTO files duplicate Zod-inferred types (RegisterInput = RegisterSchemaType)
- Field name inconsistencies (French vs English: modele/model, marqueId/brandId, immatriculation/licensePlate)
- Missing Zod schemas for output types (AuthResponse) and query params (FindTravelInput)
- Manual mapping in controllers between validated data and DTOs
- Validators live in `presentation/` but are not middleware — they're just schemas called via `.parse()` inside controllers, creating a misleading folder name

**Goal:**
- Move Zod schemas from `presentation/validators/` to `application/schemas/` (correct layer)
- Eliminate DTO duplication by using Zod schemas as the single source of truth
- Standardize all field names to English across the codebase
- Delete both `presentation/validators/` and `application/dtos/`
- Maintain full test coverage throughout migration

**User Decisions:**
- Standardize ALL domains to English (comprehensive naming cleanup)
- Incremental migration by domain (safer, reviewable)
- Break backward compatibility (delete route.dto.ts, use travel types directly)
- Move Zod schemas to application layer, import directly from controllers

## Architecture

### Before
```
presentation/validators/auth.validator.ts   -> Zod schemas + types
application/dtos/auth.dto.ts                -> Duplicate types
                    ^                              ^
         controllers import schema       use cases import DTO
         controllers manually map validated -> DTO
```
Dependencies: controller -> validator (same layer) + controller -> DTO (inward) + use case -> DTO (same layer)

### After
```
application/schemas/auth.schema.ts          -> Zod schemas + inferred types (single source of truth)
         ^ (same layer)          ^ (inward, correct)
  use cases import types    controllers import schemas
```
Dependencies: controller -> schema (inward) + use case -> schema (same layer)

### How validation works (unchanged)
1. Controller calls `schema.parse(body)` — validates and returns typed data, or throws `ZodError`
2. `error-handler.middleware.ts` catches `ZodError` upstream — returns 400 with field-level errors
3. Controller passes validated data directly to use case (no more manual DTO mapping)

The middleware has zero dependency on schemas. Only the `ZodError` class is imported generically in the error handler.

## Patterns

**Pattern 1: Simple Pass-Through** (auth, brand, city, color, user)
```typescript
// application/schemas/auth.schema.ts — single source of truth
export const registerSchema = z.object({ email, password, confirmPassword });
export type RegisterSchemaType = z.infer<typeof registerSchema>;

// Controller validates and passes directly
const validated = registerSchema.parse(body);
const result = await useCase.execute(validated);

// Use case receives the Zod-inferred type
async execute(input: RegisterSchemaType): Promise<Result<...>>
```

**Pattern 2: Auth Context Composition** (driver, inscription, travel)
```typescript
// lib/shared/types/auth-context.ts
export type WithAuthContext<T> = T & { userId: string };

// Controller composes auth context from JWT middleware
const validated = createDriverSchema.parse(body);
const input: WithAuthContext<CreateDriverSchemaType> = {
  ...validated,
  userId: c.get('userId'),
};

// Use case receives composed type
async execute(input: WithAuthContext<CreateDriverSchemaType>): Promise<...>
```

**Pattern 3: Query Parameter Validation** (travel search)
```typescript
// application/schemas/travel.schema.ts
export const findTravelQuerySchema = z.object({
  departureCity: z.string().optional(),
  arrivalCity: z.string().optional(),
  date: z.string().optional(),
});

// Controller validates query params
const validated = findTravelQuerySchema.parse({
  departureCity: c.req.query('departureCity'),
  arrivalCity: c.req.query('arrivalCity'),
  date: c.req.query('date'),
});
```

## Phase-by-Phase Implementation

### Phase 1: Move Schemas to Application Layer

Move all validator files from `src/presentation/validators/` to `src/application/schemas/`, renaming `*.validator.ts` to `*.schema.ts`. This is a mechanical change — no logic modifications.

**File moves:**
| From | To |
|---|---|
| `presentation/validators/auth.validator.ts` | `application/schemas/auth.schema.ts` |
| `presentation/validators/brand.validator.ts` | `application/schemas/brand.schema.ts` |
| `presentation/validators/car.validator.ts` | `application/schemas/car.schema.ts` |
| `presentation/validators/city.validator.ts` | `application/schemas/city.schema.ts` |
| `presentation/validators/color.validator.ts` | `application/schemas/color.schema.ts` |
| `presentation/validators/driver.validator.ts` | `application/schemas/driver.schema.ts` |
| `presentation/validators/inscription.validator.ts` | `application/schemas/inscription.schema.ts` |
| `presentation/validators/route.validator.ts` | `application/schemas/travel.schema.ts` (rename + consolidate) |
| `presentation/validators/user.validator.ts` | `application/schemas/user.schema.ts` |

**Test file moves:** Same pattern for all `*.validator.test.ts` to `*.schema.test.ts`

**Import updates in controllers:**
```typescript
// Before
import { registerSchema } from '../validators/auth.validator.js';
// After
import { registerSchema } from '../../application/schemas/auth.schema.js';
```

**Route validator to Travel schema consolidation:**
- Rename `createRouteSchema` to `createTravelSchema` and `CreateRouteSchemaType` to `CreateTravelSchemaType`
- Add the missing `findTravelQuerySchema` and `FindTravelQueryType`

**Update `presentation/index.ts`:** Remove the validator re-export line.

**Delete:** `src/presentation/validators/` directory entirely.

**Verification:**
```bash
pnpm tsc --noEmit
pnpm test
```

---

### Phase 2: Create Auth Context Utility

**File to create:** `src/lib/shared/types/auth-context.ts`

```typescript
export type WithAuthContext<T> = T & {
  userId: string;
};
```

**Verification:**
```bash
pnpm tsc --noEmit
```

---

### Phase 3: Auth Domain (Reference Implementation)

**Files to modify:**
1. `src/application/schemas/auth.schema.ts` — Add `AuthResponseType`
2. `src/application/use-cases/auth/register.use-case.ts` — Import from schemas
3. `src/application/use-cases/auth/login.use-case.ts` — Import from schemas
4. `src/presentation/controllers/auth.controller.ts` — Remove DTO mapping
5. Tests for above

**3.1 Add output type** (`auth.schema.ts`)
```typescript
export const authResponseSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
});
export type AuthResponseType = z.infer<typeof authResponseSchema>;
```

**3.2 Update use cases**
```typescript
// Before
import type { RegisterInput, AuthResponse } from '../../dtos/auth.dto.js';
// After
import type { RegisterSchemaType, AuthResponseType } from '../schemas/auth.schema.js';

async execute(input: RegisterSchemaType): Promise<Result<AuthResponseType, RegisterError>>
```

**3.3 Update controller** — Remove DTO import, remove manual mapping:
```typescript
// Before: validate -> manually copy to DTO -> execute
const validated = registerSchema.parse(body);
const input: RegisterInput = { email: validated.email, ... };
const result = await registerUseCase.execute(input);

// After: validate -> execute directly
const validated = registerSchema.parse(body);
const result = await registerUseCase.execute(validated);
```

**Verification:**
```bash
pnpm test src/application/use-cases/auth
pnpm test src/presentation/controllers/auth
pnpm tsc --noEmit
```

---

### Phase 4: Brand, City, Color Domains (Simple Pass-Through)

**Files to modify:**
- `src/application/use-cases/brand/create-brand.use-case.ts` — Import from `../schemas/brand.schema.js`
- `src/application/use-cases/city/create-city.use-case.ts` — Import from `../schemas/city.schema.js`
- `src/presentation/controllers/brand.controller.ts` — Remove DTO mapping
- `src/presentation/controllers/city.controller.ts` — Remove DTO mapping
- Color controller/use cases (if they have DTOs, otherwise already correct)
- Tests for above

**Pattern:** Same as auth — direct pass-through, no auth context needed.

**Verification:**
```bash
pnpm test src/application/use-cases/brand
pnpm test src/application/use-cases/city
pnpm tsc --noEmit
```

---

### Phase 5: Driver Domain (Auth Context Pattern)

**Files to modify:**
1. `src/application/use-cases/driver/create-driver.use-case.ts`
2. `src/presentation/controllers/driver.controller.ts`
3. Tests

**5.1 Update use case**
```typescript
// Before
import type { CreateDriverInput } from '../../dtos/driver.dto.js';
// After
import type { CreateDriverSchemaType } from '../schemas/driver.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

async execute(input: WithAuthContext<CreateDriverSchemaType>): Promise<Result<DriverEntity, CreateDriverError>>
```

**5.2 Update controller**
```typescript
const validated = createDriverSchema.parse(body);
const input: WithAuthContext<CreateDriverSchemaType> = {
  ...validated,
  userId: c.get('userId'),
};
const result = await useCase.execute(input);
```

**Verification:**
```bash
pnpm test src/application/use-cases/driver
pnpm test src/presentation/controllers/driver
pnpm tsc --noEmit
```

---

### Phase 6: Inscription Domain (Auth Context Pattern)

**Files to modify:**
1. `src/application/use-cases/inscription/create-inscription.use-case.ts`
2. `src/presentation/controllers/inscription.controller.ts`
3. Tests

**Pattern:** Same as driver — use `WithAuthContext<CreateInscriptionSchemaType>`.

**Verification:**
```bash
pnpm test src/application/use-cases/inscription
pnpm test src/presentation/controllers/inscription
pnpm tsc --noEmit
```

---

### Phase 7: Travel/Route Domain (Auth Context + Query Params)

**Files to modify:**
1. `src/application/use-cases/travel/create-travel.use-case.ts`
2. `src/application/use-cases/travel/find-travel.use-case.ts`
3. `src/application/use-cases/route/create-route.use-case.ts` (re-export)
4. `src/application/use-cases/route/find-route.use-case.ts` (re-export)
5. `src/presentation/controllers/route.controller.ts`
6. Tests

**7.1 Update travel use cases**
```typescript
// create-travel.use-case.ts
import type { CreateTravelSchemaType } from '../schemas/travel.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

async execute(input: WithAuthContext<CreateTravelSchemaType>): Promise<...>

// find-travel.use-case.ts
import type { FindTravelQueryType } from '../schemas/travel.schema.js';

async execute(input: FindTravelQueryType): Promise<...>
```

**7.2 Update route controller**
```typescript
import { createTravelSchema, findTravelQuerySchema } from '../../application/schemas/travel.schema.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';
import type { CreateTravelSchemaType } from '../../application/schemas/travel.schema.js';

// createRoute: compose auth context + pass directly
// findRoute: validate query params + pass directly
```

**Verification:**
```bash
pnpm test src/application/use-cases/travel
pnpm test src/application/use-cases/route
pnpm test src/presentation/controllers/route
pnpm tsc --noEmit
```

---

### Phase 8: Car Domain (Field Name Standardization)

This phase involves renaming French fields to English in use case logic. The schemas already use English names — the mapping layer in the controller is what currently translates English to French. Removing the DTO eliminates that translation.

**Files to modify:**
1. `src/application/use-cases/car/create-car.use-case.ts`
2. `src/application/use-cases/car/update-car.use-case.ts`
3. `src/presentation/controllers/car.controller.ts`
4. Tests

**Field name changes in use cases:**
- `input.modele` to `input.model`
- `input.marqueId` to `input.brandId`
- `input.immatriculation` to `input.licensePlate`

**Type changes:**
- `CreateCarInput` to `CreateCarSchemaType` (from `../schemas/car.schema.js`)
- `UpdateCarInput` to `PatchCarSchemaType` for patch, `UpdateCarSchemaType` for full update

**Note:** `createCarSchema` and `updateCarSchema` are identical (all fields required). `patchCarSchema` has optional fields, matching the current `UpdateCarInput` DTO. The `patchCar` controller method should use `PatchCarSchemaType` and `updateCar` should use `UpdateCarSchemaType`.

**Controller simplification:**
```typescript
// Before: validate -> translate French to English -> execute
const validated = createCarSchema.parse(body);
const input: CreateCarInput = {
  modele: validated.model,
  marqueId: validated.brandId,
  immatriculation: validated.licensePlate,
};

// After: validate -> execute directly
const validated = createCarSchema.parse(body);
const result = await useCase.execute(validated);
```

**Verification:**
```bash
pnpm test src/application/use-cases/car
pnpm test src/presentation/controllers/car
pnpm tsc --noEmit
```

---

### Phase 9: French Field Name Audit

Search the entire codebase for remaining French field names outside the Prisma schema (DB column names stay as-is).

**Scope:** entities, repository interfaces, Prisma repository implementations, use cases, tests.
**Out of scope:** Prisma schema column names (would require a migration).

**Search patterns:**
- `modele`, `marque`, `marqueId`, `marqueRefId`
- `immatriculation`, `immat`
- `couleur`
- `ville`

**For each hit:** rename to English equivalent, update all references, run tests.

**Boundary:** Prisma repositories may need a mapping at the DB boundary (e.g., `{ model: prismaResult.modele }`) if the Prisma schema uses French column names. This is acceptable — the French stops at the DB adapter.

**Verification:**
```bash
pnpm test
pnpm tsc --noEmit
```

---

### Phase 10: Cleanup — Delete DTO Files

**Files to delete:**
1. `src/application/dtos/auth.dto.ts`
2. `src/application/dtos/brand.dto.ts`
3. `src/application/dtos/car.dto.ts`
4. `src/application/dtos/city.dto.ts`
5. `src/application/dtos/driver.dto.ts`
6. `src/application/dtos/inscription.dto.ts`
7. `src/application/dtos/travel.dto.ts`
8. `src/application/dtos/route.dto.ts`

**Verification:**
```bash
# Should return no results
grep -r "application/dtos" src/ --include="*.ts"

pnpm test
pnpm tsc --noEmit
pnpm build
```

---

## File Structure After Refactoring

```
src/application/
  schemas/              <- NEW: Zod schemas + inferred types (single source of truth)
    auth.schema.ts
    brand.schema.ts
    car.schema.ts
    city.schema.ts
    color.schema.ts
    driver.schema.ts
    inscription.schema.ts
    travel.schema.ts    <- consolidated from route.validator.ts + new query schema
    user.schema.ts
  use-cases/            <- imports types from ../schemas/
    auth/
    brand/
    ...
  dtos/                 <- DELETED

src/presentation/
  controllers/          <- imports schemas from ../../application/schemas/
  middleware/            <- UNCHANGED (no schema dependency)
  routes/               <- UNCHANGED
  validators/           <- DELETED

src/lib/shared/types/
  auth-context.ts       <- NEW: WithAuthContext<T> utility type
```

## Testing Strategy

**Schema tests** (`application/schemas/*.schema.test.ts`): Moved from validators, content unchanged.

**Controller tests:** Update imports only. Mock expectations unchanged since data shapes are identical.

**Use case tests:** Update imports. For car domain, update test data field names (French to English).

**Per-phase:** `pnpm tsc --noEmit` + `pnpm test <domain>`
**Final:** `pnpm test` + `pnpm test:coverage` + `pnpm build`

## Success Criteria

- [ ] Zero imports from `application/dtos`
- [ ] Zero files in `presentation/validators/`
- [ ] All schemas live in `application/schemas/`
- [ ] All tests passing
- [ ] Test coverage maintained or improved
- [ ] TypeScript builds with no errors
- [ ] `pnpm build` succeeds
- [ ] No French field names remaining (except Prisma schema columns)
- [ ] Clean dependency direction: presentation -> application -> domain
