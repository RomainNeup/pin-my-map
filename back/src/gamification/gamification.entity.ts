import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserGamificationDocument = HydratedDocument<UserGamification>;

@Schema({ _id: false })
export class UnlockedAchievement {
  @Prop({ required: true })
  id: string;
  @Prop({ required: true, default: Date.now })
  unlockedAt: Date;
}

export const UnlockedAchievementSchema =
  SchemaFactory.createForClass(UnlockedAchievement);

@Schema({ timestamps: true })
export class UserGamification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  points: number;

  @Prop({ type: [UnlockedAchievementSchema], default: [] })
  achievements: UnlockedAchievement[];

  @Prop({ required: true, default: false })
  backfilled: boolean;
}

export const UserGamificationSchema =
  SchemaFactory.createForClass(UserGamification);
