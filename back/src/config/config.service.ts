import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfig } from 'src/config/config.entity';
import { AppConfigDto, UpdateAppConfigDto } from 'src/config/config.dto';

@Injectable()
export class ConfigService {
  constructor(
    @InjectModel(AppConfig.name) private configModel: Model<AppConfig>,
  ) {}

  async get(): Promise<AppConfigDto> {
    const doc = await this.ensure();
    return { registrationMode: doc.registrationMode };
  }

  async update(partial: UpdateAppConfigDto): Promise<{
    before: AppConfigDto;
    after: AppConfigDto;
  }> {
    const doc = await this.ensure();
    const before: AppConfigDto = { registrationMode: doc.registrationMode };
    if (partial.registrationMode !== undefined) {
      doc.registrationMode = partial.registrationMode;
    }
    await doc.save();
    const after: AppConfigDto = { registrationMode: doc.registrationMode };
    return { before, after };
  }

  private async ensure(): Promise<
    AppConfig & { save: () => Promise<AppConfig> }
  > {
    const query = this.configModel.findOneAndUpdate(
      { key: 'app' },
      { $setOnInsert: { key: 'app', registrationMode: 'open' } },
      { upsert: true, new: true },
    );
    const existing = await query;
    return existing as never;
  }
}
