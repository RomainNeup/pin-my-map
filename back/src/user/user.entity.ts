import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'user' | 'admin';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ required: true, default: 'user', enum: ['user', 'admin'] })
  role: UserRole;
  @Prop({
    required: false,
    lowercase: true,
    index: { unique: true, sparse: true },
  })
  publicSlug?: string;
  @Prop({ required: false, index: { unique: true, sparse: true } })
  publicToken?: string;
  @Prop({ required: true, default: false })
  isPublic: boolean;
  @Prop({ required: false })
  passwordResetTokenHash?: string;
  @Prop({ required: false })
  passwordResetExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
