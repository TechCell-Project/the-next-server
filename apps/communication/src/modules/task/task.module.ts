import { Module } from '@nestjs/common';
import { ImageTaskModule } from './image-task';

@Module({
    imports: [ImageTaskModule],
})
export class TaskModule {}
