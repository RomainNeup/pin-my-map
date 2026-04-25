import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'pending';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  email: string;
  @Prop({ required: false })
  password?: string;
  @Prop({ required: true, default: 'user', enum: ['user', 'admin'] })
  role: UserRole;
  @Prop({
    required: true,
    default: 'active',
    enum: ['active', 'pending'],
  })
  status: UserStatus;
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
}

export const UserSchema = SchemaFactory.createForClass(User);
