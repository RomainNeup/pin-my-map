import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from 'src/audit/audit.module';
import { GamificationModule } from 'src/gamification/gamification.module';
import { Place, PlaceSchema } from 'src/place/place.entity';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import { Tag, TagSchema } from 'src/tag/tag.entity';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Place.name, schema: PlaceSchema },
      { name: Tag.name, schema: TagSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
    ]),
    GamificationModule,
    AuditModule,
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
