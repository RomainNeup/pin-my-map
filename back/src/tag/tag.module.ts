import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Tag, TagSchema } from './tag.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
    ]),
  ],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
