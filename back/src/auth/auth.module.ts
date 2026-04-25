import { Module } from '@nestjs/common';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from '../user/user.module';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JoseService } from './jose.service';

@Module({
  imports: [UserModule, ConfigModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JoseService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [JoseService],
})
export class AuthModule {}
