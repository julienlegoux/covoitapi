// Re-export Travel types under the old Route names for backward compatibility.
// Phase 4 will remove this file and update all consumers.
export type { TravelEntity as RouteEntity, CreateTravelData as CreateRouteData } from './travel.entity.js';
