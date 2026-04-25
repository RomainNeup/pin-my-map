import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PlaceModule } from './place/place.module';
import { TagModule } from './tag/tag.module';
import { SavedPlaceModule } from './saved/saved.module';
import { ImportModule } from './import/import.module';
import { SuggestionModule } from './suggestion/suggestion.module';
import { AuditModule } from './audit/audit.module';
import { GamificationModule } from './gamification/gamification.module';
import { PublicMapModule } from './public-map/public-map.module';
import { FollowModule } from './follow/follow.module';
import { PlaceCommentModule } from './place-comment/place-comment.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost/pin-my-map',
    ),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    AuthModule,
    PlaceModule,
    TagModule,
    SavedPlaceModule,
    ImportModule,
    SuggestionModule,
    AuditModule,
    GamificationModule,
    PublicMapModule,
    FollowModule,
    PlaceCommentModule,
    McpModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
