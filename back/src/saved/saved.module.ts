import { Module } from "@nestjs/common";
import { SavedController } from "./saved.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { SavedPlace, SavedPlaceSchema } from "./saved.entity";
import { SavedPlaceService } from "./saved.service";
import { PlaceModule } from "src/place/place.module";
import { TagModule } from "src/tag/tag.module";

@Module({
    imports: [
        MongooseModule.forFeature([{name: SavedPlace.name, schema: SavedPlaceSchema}]),
        PlaceModule,
        TagModule
    ],
    controllers: [SavedController],
    providers: [SavedPlaceService]
})

export class SavedPlaceModule {}