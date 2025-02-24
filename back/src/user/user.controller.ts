import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "src/user/user.service";

@Controller('user')
@ApiTags('user')
export class UserController {
    constructor(private userService: UserService) {}
}