export interface CreateRatingInput {
  readonly overall: number;
  readonly wifi?: number;
  readonly noise?: number;
  readonly powerOutlets?: number;
  readonly comfort?: number;
}

export interface UpdateRatingInput {
  readonly overall?: number;
  readonly wifi?: number;
  readonly noise?: number;
  readonly powerOutlets?: number;
  readonly comfort?: number;
}

export interface RatingResponse {
  readonly id: string;
  readonly workspotId: string;
  readonly userId: string;
  readonly overall: number;
  readonly wifi: number | null;
  readonly noise: number | null;
  readonly powerOutlets: number | null;
  readonly comfort: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
