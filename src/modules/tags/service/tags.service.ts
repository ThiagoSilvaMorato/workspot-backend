import type { TagsRepository } from '../repository/tags.repository.js';
import { ConflictError } from '../../../shared/errors/AppError.js';
import { slugify } from '../../../shared/utils/slugify.js';
import type { CreateTagInput, TagResponse } from '../types/tags.types.js';

function toTagResponse(tag: { id: string; name: string; slug: string }): TagResponse {
  return { id: tag.id, name: tag.name, slug: tag.slug };
}

export function makeTagsService(repository: TagsRepository) {
  async function listTags(): Promise<TagResponse[]> {
    const tags = await repository.findAll();
    return tags.map(toTagResponse);
  }

  async function createTag(data: CreateTagInput): Promise<TagResponse> {
    const slug = slugify(data.name);

    const existing = await repository.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Tag with name "${data.name}" already exists`);
    }

    const tag = await repository.create({ name: data.name, slug });
    return toTagResponse(tag);
  }

  return { listTags, createTag };
}
