export interface CreateReviewInput {
  readonly content: string;
}

export interface UpdateReviewInput {
  readonly content: string;
}

export interface ReviewAuthor {
  readonly id: string;
  readonly name: string;
}

export interface ReviewResponse {
  readonly id: string;
  readonly workspotId: string;
  readonly content: string;
  readonly author: ReviewAuthor;
  readonly createdAt: string;
  readonly updatedAt: string;
}
