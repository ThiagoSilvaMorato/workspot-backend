import type { JwtUser, PaginatedResult, PaginationInput } from '../../users/types/users.types.js';

export type { JwtUser, PaginatedResult, PaginationInput };

export interface CreateWorkSpotInput {
  readonly name: string;
  readonly description: string;
  readonly street: string;
  readonly number: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly tagIds: string[];
}

export interface UpdateWorkSpotInput {
  readonly name?: string;
  readonly description?: string;
  readonly street?: string;
  readonly number?: string;
  readonly complement?: string;
  readonly neighborhood?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly tagIds?: string[];
}

export interface ListWorkSpotsFilters {
  readonly city?: string;
  readonly page: number;
  readonly limit: number;
}

export interface WorkSpotAddress {
  readonly street: string;
  readonly number: string;
  readonly complement: string | null;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly country: string;
}

export interface WorkSpotCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface TagSummary {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface AverageRatings {
  readonly overall: number | null;
  readonly wifi: number | null;
  readonly noise: number | null;
  readonly powerOutlets: number | null;
  readonly comfort: number | null;
  readonly count: number;
}

export interface WorkSpotSummaryResponse {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly city: string;
  readonly state: string;
  readonly tags: TagSummary[];
  readonly averageOverall: number | null;
  readonly reviewCount: number;
  readonly createdAt: string;
}

export interface WorkSpotDetailResponse {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly address: WorkSpotAddress;
  readonly coordinates: WorkSpotCoordinates;
  readonly tags: TagSummary[];
  readonly averageRatings: AverageRatings;
  readonly reviewCount: number;
  readonly createdBy: { id: string; name: string };
  readonly createdAt: string;
  readonly updatedAt: string;
}
