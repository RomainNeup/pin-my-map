import { Module } from "@nestjs/common";
import { TagService } from "./tag.service";
import { TagController } from "./tag.controller";
import { Tag, TagSchema } from "./tag.entity";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
    imports: [
        MongooseModule.forFeature([{name: Tag.name, schema: TagSchema}]),
    ],
    controllers: [TagController],
    providers: [TagService],
    exports: [TagService],
})

export class TagModule {}