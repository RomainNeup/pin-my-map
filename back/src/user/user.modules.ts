import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserController } from "src/user/user.controller";
import { User, UserSchema } from "src/user/user.entity";
import { UserMapper } from "src/user/user.mapper";
import { UserService } from "src/user/user.service";

@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}])
    ],
    controllers: [UserController],
    providers: [UserService, UserMapper],
    exports: [UserService]
})

export class UserModule {}