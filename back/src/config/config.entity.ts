import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RegistrationMode = 'open' | 'approval-required' | 'invite-only';

export const REGISTRATION_MODES: RegistrationMode[] = [
  'open',
  'approval-required',
  'invite-only',
];

export type AppConfigDocument = HydratedDocument<AppConfig>;

@Schema({ timestamps: true })
export class AppConfig {
  @Prop({ required: true, unique: true, default: 'app' })
  key: 'app';

  @Prop({
    required: true,
    default: 'open',
    enum: REGISTRATION_MODES,
  })
  registrationMode: RegistrationMode;
}

export const AppConfigSchema = SchemaFactory.createForClass(AppConfig);
