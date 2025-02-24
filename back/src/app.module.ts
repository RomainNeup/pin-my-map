import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { PlaceModule } from './place/place.module';
import { TagModule } from './tag/tag.module';
import { SavedPlaceModule } from './saved/saved.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/pin-my-map'),
    AuthModule,
    PlaceModule,
    TagModule,
    SavedPlaceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
