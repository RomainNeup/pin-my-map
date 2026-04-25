import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PlaceDocument = HydratedDocument<Place>;

@Schema({ _id: false })
export class PlaceEnrichmentPhoto {
  @Prop({ required: true })
  url: string;
  @Prop()
  attribution?: string;
}

@Schema({ _id: false })
export class PlaceEnrichmentReview {
  @Prop()
  author: string;
  @Prop()
  rating: number;
  @Prop()
  text: string;
  @Prop()
  time: number;
}

@Schema({ _id: false })
export class PlaceEnrichment {
  @Prop()
  externalId: string;
  @Prop()
  providerName: string;
  @Prop({ type: [Object], default: undefined })
  photos?: PlaceEnrichmentPhoto[];
  @Prop()
  website?: string;
  @Prop()
  phoneNumber?: string;
  @Prop({ type: Object })
  openingHours?: { weekdayText: string[] };
  @Prop()
  externalRating?: number;
  @Prop()
  externalRatingCount?: number;
  @Prop({ type: [Object], default: undefined })
  reviews?: PlaceEnrichmentReview[];
  @Prop()
  priceLevel?: number;
  @Prop({ type: [String], default: undefined })
  types?: string[];
  @Prop()
  fetchedAt: Date;
}

@Schema()
export class Place {
  @Prop({ required: true })
  name: string;
  @Prop({ required: false })
  description: string;
  @Prop({ required: true, index: '2dsphere', type: [Number] })
  location: number[];
  @Prop({ required: false })
  address: string;
  @Prop({ required: false })
  image: string;
  @Prop({ required: false })
  externalId?: string;
  @Prop({ required: false })
  externalProvider?: string;
  @Prop({ type: Object, required: false })
  enrichment?: PlaceEnrichment;
  @Prop({ required: false })
  enrichedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  createdBy?: Types.ObjectId;
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
