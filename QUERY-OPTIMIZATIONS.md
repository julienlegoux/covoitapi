# Query Optimization Opportunities

Redundant sequential queries found across use cases. Each case fetches an entity by UUID just to extract its `refId`, then queries a related entity with that `refId`. Prisma relation filters can collapse these into a single query.

## Pattern 1: User UUID → refId → Driver (6 occurrences)

**Current:**
```ts
const userResult = await this.userRepository.findById(input.userId);
const driverResult = await this.driverRepository.findByUserRefId(userResult.value.refId);
```

**Fix:** Add `driverRepository.findByUserId(userId: string)` using:
```ts
prisma.driver.findFirst({ where: { user: { id: userId } } })
```

**Affected use cases:**
- `src/application/use-cases/car/create-car.use-case.ts` (lines 76-92)
- `src/application/use-cases/car/update-car.use-case.ts` (lines 90-104)
- `src/application/use-cases/car/delete-car.use-case.ts` (lines 74-88)
- `src/application/use-cases/travel/create-travel.use-case.ts` (lines 78-94)
- `src/application/use-cases/travel/delete-travel.use-case.ts` (lines 74-88)
- `src/application/use-cases/driver/create-driver.use-case.ts` (lines 72-95)

## Pattern 2: User UUID → refId → Inscriptions

**Current:**
```ts
const userResult = await this.userRepository.findById(userId);
const result = await this.inscriptionRepository.findByUserRefId(userResult.value.refId);
```

**Fix:** Add `inscriptionRepository.findByUserId(userId: string)` using:
```ts
prisma.inscription.findMany({ where: { user: { id: userId } } })
```

**Affected use cases:**
- `src/application/use-cases/inscription/list-user-inscriptions.use-case.ts` (lines 63-67)

## Pattern 3: Travel UUID → refId → Inscriptions

**Current:**
```ts
const travelResult = await this.travelRepository.findById(routeId);
const result = await this.inscriptionRepository.findByRouteRefId(travelResult.value.refId);
```

**Fix:** Add `inscriptionRepository.findByTravelId(travelId: string)` using:
```ts
prisma.inscription.findMany({ where: { route: { id: travelId } } })
```

**Affected use cases:**
- `src/application/use-cases/inscription/list-route-passengers.use-case.ts` (lines 63-67)

## Pattern 4: Ownership check via refId comparison

**Current:**
```ts
const userResult = await this.userRepository.findById(input.userId);
if (findResult.value.userRefId !== userResult.value.refId) { ... }
```

**Fix:** Compare directly using UUID relation in a Prisma `where` clause instead of fetching the user.

**Affected use cases:**
- `src/application/use-cases/inscription/delete-inscription.use-case.ts` (lines 72-78)

## Implementation Steps

1. Add new methods to repository interfaces (`findByUserId`, `findByTravelId`)
2. Implement them in Prisma repositories using relation filters
3. Add cached variants in cache repositories
4. Update use cases to use the new methods and remove `userRepository` dependency where it's no longer needed
5. Update tests
