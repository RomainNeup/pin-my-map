import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { User } from "src/user/user.entity";

export type TagDocument = HydratedDocument<Tag>;

@Schema()
export class Tag {
    @Prop({ required: true })
    name: string;
    @Prop({ required: false })
    emoji: string;
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    owner: User;
}

export const TagSchema = SchemaFactory.createForClass(Tag);