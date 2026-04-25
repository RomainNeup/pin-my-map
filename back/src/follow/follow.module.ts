import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationModule } from 'src/gamification/gamification.module';
import { User, UserSchema } from 'src/user/user.entity';
import { FollowController } from './follow.controller';
import { Follow, FollowSchema } from './follow.entity';
import { FollowService } from './follow.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
      { name: User.name, schema: UserSchema },
    ]),
    GamificationModule,
  ],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
