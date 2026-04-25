import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationModule } from 'src/gamification/gamification.module';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import { User, UserSchema } from 'src/user/user.entity';
import { PlaceCommentController } from './place-comment.controller';
import { PlaceComment, PlaceCommentSchema } from './place-comment.entity';
import { PlaceCommentService } from './place-comment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlaceComment.name, schema: PlaceCommentSchema },
      { name: SavedPlace.name, schema: SavedPlaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    GamificationModule,
  ],
  controllers: [PlaceCommentController],
  providers: [PlaceCommentService],
  exports: [PlaceCommentService],
})
export class PlaceCommentModule {}
