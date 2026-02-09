// Re-export Travel repository types under the old Route names for backward compatibility.
// Phase 4 will remove this file and update all consumers.
export type { TravelFilters as RouteFilters, TravelRepository as RouteRepository } from './travel.repository.js';
export type { CreateTravelData as CreateRouteData, TravelEntity as RouteEntity } from '../entities/travel.entity.js';
