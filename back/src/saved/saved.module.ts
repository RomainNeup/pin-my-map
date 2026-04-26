import { Module } from '@nestjs/common';
import { SavedController } from './saved.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SavedPlace, SavedPlaceSchema } from './saved.entity';
import { SavedPlaceService } from './saved.service';
import { PlaceModule } from 'src/place/place.module';
import { Tag, TagSchema } from 'src/tag/tag.entity';
import { TagModule } from 'src/tag/tag.module';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedPlace.name, schema: SavedPlaceSchema },
      { name: Tag.name, schema: TagSchema },
    ]),
    PlaceModule,
    TagModule,
    GamificationModule,
  ],
  controllers: [SavedController],
  providers: [SavedPlaceService],
  exports: [SavedPlaceService],
})
export class SavedPlaceModule {}
