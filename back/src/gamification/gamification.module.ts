import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from 'src/follow/follow.entity';
import { Place, PlaceSchema } from 'src/place/place.entity';
import {
  PlaceComment,
  PlaceCommentSchema,
} from 'src/place-comment/place-comment.entity';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import {
  PlaceSuggestion,
  PlaceSuggestionSchema,
} from 'src/suggestion/suggestion.entity';
import { Tag, TagSchema } from 'src/tag/tag.entity';
import { User, UserSchema } from 'src/user/user.entity';
import { GamificationController } from './gamification.controller';
import {
  UserGamification,
  UserGamificationSchema,
} from './gamification.entity';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserGamification.name, schema: UserGamificationSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
      { name: Place.name, schema: PlaceSchema },
      { name: Tag.name, schema: TagSchema },
      { name: PlaceSuggestion.name, schema: PlaceSuggestionSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: PlaceComment.name, schema: PlaceCommentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
