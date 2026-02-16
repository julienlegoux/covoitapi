# VP Implementation Plan (Notion Compliance)

**Objective**: Create a strict compatibility layer (`/vp`) that matches the API specification from the [Notion Page](https://golden-papyrus-339.notion.site/Soutenance-4-Covoiturage-GRETA-2fccb94bacbc80ec8fa6c13b21b53352).
**Constraint**: Do not modify existing core code. All changes must be contained within `src/presentation/vp/`.

## 1. Architecture

We will implement an **Adapter Pattern**.
- The `src/presentation/vp/` module will act as a facade.
- It will expose the Notion-specific routes.
- It will transform incoming requests (e.g., nested addresses) -> Internal Domain format.
- It will transform outgoing responses (Internal Domain format) -> Notion format.

## 2. Directory Structure

```
src/presentation/vp/
├── controllers/          # Adapter Controllers
│   ├── auth.controller.ts
│   ├── car.controller.ts
│   ├── person.controller.ts  # Was user.controller
│   ├── brand.controller.ts
│   └── trip.controller.ts
├── routes.ts             # Main VP Router definition
└── types.ts              # PDF-specific type definitions (Address, etc.)
```

## 3. Route & Field Mapping Strategy

### 3.1 Authentication
| Route | Method | Internal Mapping |
| :--- | :--- | :--- |
| `POST /register` | POST | `Auth.register` (Direct pass-through) |
| `POST /login` | POST | `Auth.login` (Direct pass-through) |

### 3.2 Cars
| Route | Method | Internal Mapping |
| :--- | :--- | :--- |
| `GET /cars` | GET | `ListCarsUseCase` |
| `GET /cars/{id}` | GET | `GetCarUseCase` (if exists) or list filtered. |
| `POST /cars` | POST | `CreateCarUseCase` |
| | Input | Map `carregistration` -> `licensePlate`. Map `brand` name -> `brandRefId` (find/create). |
| `PUT /cars/{id}` | PUT | `UpdateCarUseCase` |
| `DELETE /cars/{id}` | DELETE | `DeleteCarUseCase` |

### 3.3 Persons (Users)
| Route | Method | Internal Mapping |
| :--- | :--- | :--- |
| `GET /persons` | GET | `ListUsersUseCase` |
| `GET /persons/{id}` | GET | `GetUserUseCase` |
| `POST /persons` | POST | `Auth.register` (Map `firstname`, `lastname`, `phone`, `email`, `password`). |
| `PATCH /persons/{id}` | PATCH | `UpdateProfileUseCase` or `AnonymizeUserUseCase` |
| | Logic | If `status === "DELETED"`, call `AnonymizeUser`. Else update fields. |
| `DELETE /persons/{id}` | DELETE | `AnonymizeUserUseCase` |
| `GET /persons/{id}/trips-driver` | GET | **New**: List trips where `driverRefId` matches user's driver profile. |
| `GET /persons/{id}/trips-passenger` | GET | **New**: List inscriptions for user. |

### 3.4 Brands
| Route | Method | Internal Mapping |
| :--- | :--- | :--- |
| `GET /brands` | GET | `ListBrandsUseCase` |
| `POST /brands` | POST | `CreateBrandUseCase` |
| `PUT /brands/{id}` | PUT | **New**: Update brand name. |
| `DELETE /brands/{id}` | DELETE | `DeleteBrandUseCase` |

### 3.5 Trips
| Route | Method | Internal Mapping |
| :--- | :--- | :--- |
| `GET /trips` | GET | `ListTripsUseCase` |
| | Query | Map `startingcity` -> `departureCity`, `arrivalcity` -> `arrivalCity`, `tripdate` -> `date`. |
| `GET /trips/{id}` | GET | `GetTripUseCase` |
| `GET /trips/{id}/person` | GET | **New**: List passengers for trip. |
| `POST /trips` | POST | `CreateTripUseCase` |
| | Input | **Complex Address**: Extract `city_name` from `starting_address`/`arrival_address`. |
| | Input | Map `trip_datetime` -> `date`. |
| `PATCH /trips/{id}` | PATCH | `UpdateTripUseCase` (Not implemented? Use Delete+Create or custom). |
| `DELETE /trips/{id}` | DELETE | `DeleteTripUseCase` |
| `POST /trips/{id}/person` | POST | `CreateInscriptionUseCase` |
| | Input | Map `{ person_id }` + route `{ id }` -> Inscription. |

## 4. Implementation Details

### Address Handling (Trip Controller)
```typescript
// Adapter Logic for POST /trips
const { starting_address, arrival_address, ...rest } = body;
const internalInput = {
    departureCity: starting_address.city_name,
    arrivalCity: arrival_address.city_name,
    // ... map rest
};
```

### Routes File (`routes.ts`)
```typescript
const vpRouter = new Hono();
vpRouter.route('/cars', carRoutes);
vpRouter.route('/persons', personRoutes);
// ...
export { vpRouter };
```

## 5. Next Steps

1.  **Scaffold**: Create `src/presentation/vp/` structure.
2.  **Implement**: `auth`, `car`, `person`, `brand`, `trip` controllers in VP.
3.  **Router**: Wire up `routes.ts`.
4.  **Mount**: Add to `app.ts` or `index.ts`.

## 6. Verification
- Manual verification using Insomnia/Postman against the Notion spec endpoints.
- Check payload mappings (especially addresses).
