import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditModule } from 'src/audit/audit.module';
import { ConfigController } from 'src/config/config.controller';
import { AppConfig, AppConfigSchema } from 'src/config/config.entity';
import { ConfigService } from 'src/config/config.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppConfig.name, schema: AppConfigSchema },
    ]),
    AuditModule,
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
