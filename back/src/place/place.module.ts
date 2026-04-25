import { Module } from '@nestjs/common';
import { PlaceService } from 'src/place/place.service';
import { PlaceController } from './place.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Place, PlaceSchema } from './place.entity';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import { EnrichmentModule } from 'src/enrichment/enrichment.module';
import { GamificationModule } from 'src/gamification/gamification.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Place.name, schema: PlaceSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
    ]),
    EnrichmentModule,
    GamificationModule,
    AuditModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
