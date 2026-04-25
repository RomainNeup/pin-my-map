import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { ConfigModule } from 'src/config/config.module';
import { UserModule } from '../user/user.module';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JoseService } from './jose.service';
import { User, UserSchema } from '../user/user.entity';
import { AuditModule } from '../audit/audit.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    AuditModule,
    MailerModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
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
