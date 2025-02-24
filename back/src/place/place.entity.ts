import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type PlaceDocument = HydratedDocument<Place>;

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
}

export const PlaceSchema = SchemaFactory.createForClass(Place);
