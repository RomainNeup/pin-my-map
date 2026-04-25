import { Module } from '@nestjs/common';
import { PlaceService } from 'src/place/place.service';
import { PlaceController } from './place.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Place, PlaceSchema } from './place.entity';
import { EnrichmentModule } from 'src/enrichment/enrichment.module';
import { GamificationModule } from 'src/gamification/gamification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }]),
    EnrichmentModule,
    GamificationModule,
  ],
  controllers: [PlaceController],
  providers: [PlaceService],
  exports: [PlaceService],
})
export class PlaceModule {}
