import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'pending' | 'rejected' | 'suspended';

export const USER_STATUSES: UserStatus[] = [
  'active',
  'pending',
  'rejected',
  'suspended',
];

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, index: true })
  name: string;
  @Prop({ required: true })
  email: string;
  @Prop({ required: false })
  password?: string;
  @Prop({ required: true, default: 'user', enum: ['user', 'admin'] })
  role: UserRole;
  @Prop({ required: true, default: 'active', enum: USER_STATUSES })
  status: UserStatus;
  @Prop({ required: false })
  rejectionReason?: string;
  @Prop({ required: false, index: { unique: true, sparse: true } })
  googleId?: string;
  @Prop({ required: false, index: { unique: true, sparse: true } })
  appleSub?: string;
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
