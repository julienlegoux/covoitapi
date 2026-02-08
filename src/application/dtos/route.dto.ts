// Re-export Travel DTO types under the old Route names for backward compatibility.
// Phase 4 will remove this file and update all consumers.
export type { CreateTravelInput as CreateRouteInput, FindTravelInput as FindRouteInput } from './travel.dto.js';
