import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "src/auth/auth.controller";
import { AuthService } from "src/auth/auth.service";
import { UserModule } from "../user/user.modules";
import { AuthGuard } from "./auth.guard";
import { APP_GUARD } from "@nestjs/core";

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || "secret",
            signOptions: { expiresIn: '1h' }
        }),
        UserModule
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        }
    ],
    exports: []
})

export class AuthModule { }