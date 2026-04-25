import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { SavedPlaceDocument } from 'src/saved/saved.entity';
import { UserDocument } from 'src/user/user.entity';

export type PlaceCommentDocument = HydratedDocument<PlaceComment>;

@Schema({ timestamps: true })
export class PlaceComment {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author: UserDocument;
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavedPlace',
  })
  savedPlace: SavedPlaceDocument;
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: UserDocument;
  @Prop({ required: true })
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PlaceCommentSchema = SchemaFactory.createForClass(PlaceComment);
PlaceCommentSchema.index({ savedPlace: 1, createdAt: -1 });
PlaceCommentSchema.index({ author: 1 });
