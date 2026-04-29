import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export type PlaceSuggestionDocument = HydratedDocument<PlaceSuggestion>;

@Schema({ timestamps: true })
export class PlaceSuggestion {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Place', required: true })
  place: Types.ObjectId;

  @Prop({ type: Object, required: true })
  changes: {
    name?: string;
    description?: string;
    address?: string;
    location?: number[]; // [lng, lat]
    image?: string;
    permanentlyClosed?: boolean;
  };

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: SuggestionStatus;

  @Prop({ required: false })
  note?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  reviewedBy?: Types.ObjectId;

  @Prop({ required: false })
  reviewedAt?: Date;

  @Prop({ required: false })
  reviewReason?: string;
}

export const PlaceSuggestionSchema =
  SchemaFactory.createForClass(PlaceSuggestion);
PlaceSuggestionSchema.index({ status: 1, createdAt: -1 });
