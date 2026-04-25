import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { Tag, TagSchema } from './tag.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
    ]),
    GamificationModule,
  ],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
