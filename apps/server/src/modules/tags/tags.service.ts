import { Injectable } from '@nestjs/common';
import { TagRepository } from './tags.repository';
import { CreateTagDto } from './dtos';

@Injectable()
export class TagsService {
    constructor(private readonly categoryRepository: TagRepository) {}

    async createTag(data: CreateTagDto) {}
}
