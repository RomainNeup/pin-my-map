import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowModule } from 'src/follow/follow.module';
import { SavedPlace, SavedPlaceSchema } from 'src/saved/saved.entity';
import { User, UserSchema } from 'src/user/user.entity';
import { UserModule } from 'src/user/user.module';
import { PublicMapController } from './public-map.controller';
import { PublicMapService } from './public-map.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SavedPlace.name, schema: SavedPlaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
    FollowModule,
  ],
  controllers: [PublicMapController],
  providers: [PublicMapService],
})
export class PublicMapModule {}
