# Query Optimization Implementation Plan

This plan addresses the widespread pattern of redundant sequential queries identified in `QUERY-OPTIMIZATIONS.md`. The goal is to eliminate unnecessary `User` entity fetches when looking up related entities (Driver, Inscription) by leveraging Prisma's relation filters to query directly by User UUID.

## Core Strategy

Modify repository interfaces and implementations to support direct lookups using the User UUID (the public `id` field) rather than requiring the internal integer `refId`. This allows us to bypassing the initial User lookup query.

## Detailed Changes

### 1. Domain Layer Updates

**File:** `src/domain/repositories/driver.repository.ts`
- Add method: `findByUserId(userId: string): Promise<Result<DriverEntity | null, RepositoryError>>`

**File:** `src/domain/repositories/inscription.repository.ts`
- Add method: `findByUserId(userId: string): Promise<Result<InscriptionEntity[], RepositoryError>>`
- Add method: `findByTravelId(travelId: string): Promise<Result<InscriptionEntity[], RepositoryError>>`
- Add method: `findByIdAndUserId(id: string, userId: string): Promise<Result<InscriptionEntity | null, RepositoryError>>`
  - *Purpose:* Validates both existence and ownership in a single optimized query.

### 2. Infrastructure Layer Updates

#### Database (Prisma)

**File:** `src/infrastructure/database/repositories/prisma-driver.repository.ts`
- Implement `findByUserId` using a relation filter:
  ```typescript
  return this.prisma.driver.findFirst({ where: { user: { id: userId } } });
  ```

**File:** `src/infrastructure/database/repositories/prisma-inscription.repository.ts`
- Implement `findByUserId`:
  ```typescript
  return this.prisma.inscription.findMany({ 
    where: { user: { id: userId } }, 
    include: { travel: true } 
  });
  ```
- Implement `findByTravelId`:
  ```typescript
  return this.prisma.inscription.findMany({ 
      where: { route: { id: travelId } }, // Note: relation name is 'travel' or 'route' in schema? Schema says 'travel', field is 'routeRefId'. Relation is 'travel'.
      // Wait, schema says `travel Travel @relation...`. But query uses `where: { travel: { id: travelId } }`.
      // The schema field is `travel`.
      include: { user: true } 
  });
  ```
  *(Correction from schema analysis: The relation on Inscription model is named `travel`. The relation on Driver model is named `user`.)*
- Implement `findByIdAndUserId`:
  ```typescript
  return this.prisma.inscription.findFirst({
    where: { id, user: { id: userId } }
  });
  ```

#### Cache Layer

**File:** `src/infrastructure/cache/repositories/cached-driver.repository.ts`
- Implement `findByUserId` with cache pattern.
- **Cache Key:** `driver:findByUserId:${userId}`
- **TTL:** `config.ttl.driver`

**File:** `src/infrastructure/cache/repositories/cached-inscription.repository.ts`
- Implement methods with cache patterns.
- **Cache Keys:**
  - `inscription:findByUserId:${userId}`
  - `inscription:findByTravelId:${travelId}`
  - `inscription:findByIdAndUserId:${id}:${userId}`

### 3. Application Layer (Use Case Optimizations)

Update the following files to use the new repository methods, removing the initial `userRepository.findById(userId)` call:

1.  **Car Management**:
    - `src/application/use-cases/car/create-car.use-case.ts`
    - `src/application/use-cases/car/update-car.use-case.ts`
    - `src/application/use-cases/car/delete-car.use-case.ts`

2.  **Travel Management**:
    - `src/application/use-cases/travel/create-travel.use-case.ts`
    - `src/application/use-cases/travel/delete-travel.use-case.ts`

3.  **Driver Management**:
    - `src/application/use-cases/driver/create-driver.use-case.ts`

4.  **Inscription Management**:
    - `src/application/use-cases/inscription/list-user-inscriptions.use-case.ts`
    - `src/application/use-cases/inscription/list-route-passengers.use-case.ts`
    - `src/application/use-cases/inscription/delete-inscription.use-case.ts`
      - *Special Case:* Use `inscriptionRepo.findByIdAndUserId(id, userId)` to enforce ownership check without fetching the User entity.

## Verification Steps

1.  **Build Check**: Ensure no type errors in updated repositories and use cases.
2.  **Integration Tests**: Run existing integration tests to verify no regressions.
    ```bash
    npx vitest run tests/integration/car.routes.test.ts
    npx vitest run tests/integration/travel.routes.test.ts
    npx vitest run tests/integration/inscription.routes.test.ts
    ```
3.  **Performance Check**: Verify that `SELECT * FROM "users"` is no longer part of the transaction logs for these operations.
