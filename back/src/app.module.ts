import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { PlaceModule } from './place/place.module';
import { TagModule } from './tag/tag.module';
import { SavedPlaceModule } from './saved/saved.module';
import { ImportModule } from './import/import.module';
import { SuggestionModule } from './suggestion/suggestion.module';
import { AuditModule } from './audit/audit.module';
import { GamificationModule } from './gamification/gamification.module';
import { PublicMapModule } from './public-map/public-map.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/pin-my-map',
    ),
    AuthModule,
    PlaceModule,
    TagModule,
    SavedPlaceModule,
    ImportModule,
    SuggestionModule,
    AuditModule,
    GamificationModule,
    PublicMapModule,
    McpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
