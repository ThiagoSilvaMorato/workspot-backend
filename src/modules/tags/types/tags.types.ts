export interface CreateTagInput {
  readonly name: string;
}

export interface TagResponse {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}
