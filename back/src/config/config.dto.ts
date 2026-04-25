import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { REGISTRATION_MODES, RegistrationMode } from 'src/config/config.entity';

@ApiSchema({ name: 'App Config' })
export class AppConfigDto {
  @ApiProperty({ enum: REGISTRATION_MODES })
  registrationMode: RegistrationMode;
}

@ApiSchema({ name: 'Public App Config' })
export class PublicAppConfigDto {
  @ApiProperty({ enum: REGISTRATION_MODES })
  registrationMode: RegistrationMode;
}

@ApiSchema({ name: 'Update App Config Request' })
export class UpdateAppConfigDto {
  @ApiProperty({ required: false, enum: REGISTRATION_MODES })
  @IsOptional()
  @IsIn(REGISTRATION_MODES)
  registrationMode?: RegistrationMode;
}
