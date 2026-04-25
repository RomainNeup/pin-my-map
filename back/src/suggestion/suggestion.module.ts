import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from 'src/audit/audit.module';
import { Place, PlaceSchema } from 'src/place/place.entity';
import { PlaceModule } from 'src/place/place.module';
import { GamificationModule } from 'src/gamification/gamification.module';
import { SuggestionController } from './suggestion.controller';
import { PlaceSuggestion, PlaceSuggestionSchema } from './suggestion.entity';
import { SuggestionService } from './suggestion.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlaceSuggestion.name, schema: PlaceSuggestionSchema },
      { name: Place.name, schema: PlaceSchema },
    ]),
    PlaceModule,
    AuditModule,
    GamificationModule,
  ],
  controllers: [SuggestionController],
  providers: [SuggestionService],
  exports: [SuggestionService],
})
export class SuggestionModule {}
