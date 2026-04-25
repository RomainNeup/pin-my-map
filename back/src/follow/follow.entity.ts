import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserDocument } from 'src/user/user.entity';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({ timestamps: true })
export class Follow {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  follower: UserDocument;
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  followed: UserDocument;
  createdAt: Date;
  updatedAt: Date;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
FollowSchema.index({ follower: 1, followed: 1 }, { unique: true });
FollowSchema.index({ followed: 1 });
