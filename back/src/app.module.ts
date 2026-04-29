import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
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
import { ConfigModule } from './config/config.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost/pin-my-map',
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 60 }],
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    ConfigModule,
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
    MailerModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
