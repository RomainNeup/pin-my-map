import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { PlaceDocument } from "src/place/place.entity";
import { TagDocument } from "src/tag/tag.entity";
import { UserDocument } from "src/user/user.entity";

export type SavedPlaceDocument = HydratedDocument<SavedPlace>;

@Schema()
export class SavedPlace {
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: UserDocument;
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Place' })
    place: PlaceDocument;
    @Prop({ type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}] })
    tags: TagDocument[];
    @Prop({ default: false })
    done: boolean;
    @Prop({ default: '' })
    comment: string;
    @Prop({ min: 1, max: 5, default: undefined})
    rating?: number;
    @Prop({ default: Date.now })
    createdAt: Date;
}

export const SavedPlaceSchema = SchemaFactory.createForClass(SavedPlace);
SavedPlaceSchema.index({ user: 1, place: 1 }, { unique: true });