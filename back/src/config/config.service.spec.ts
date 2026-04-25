import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from './config.service';
import { AppConfig } from './config.entity';

describe('ConfigService', () => {
  let service: ConfigService;
  let doc: {
    registrationMode: string;
    save: jest.Mock;
  };
  let configModel: {
    findOneAndUpdate: jest.Mock;
  };

  beforeEach(async () => {
    doc = {
      registrationMode: 'open',
      save: jest.fn().mockResolvedValue(undefined),
    };
    configModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue(doc),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: getModelToken(AppConfig.name), useValue: configModel },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  describe('get', () => {
    it('returns the current registrationMode', async () => {
      const result = await service.get();
      expect(result.registrationMode).toBe('open');
    });

    it('calls findOneAndUpdate to upsert the singleton doc', async () => {
      await service.get();
      expect(configModel.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'app' },
        expect.any(Object),
        expect.objectContaining({ upsert: true }),
      );
    });
  });

  describe('update', () => {
    it('updates registrationMode and returns before/after', async () => {
      doc.registrationMode = 'open';

      const { before, after } = await service.update({
        registrationMode: 'approval-required',
      });

      expect(before.registrationMode).toBe('open');
      expect(after.registrationMode).toBe('approval-required');
      expect(doc.save).toHaveBeenCalled();
    });

    it('is a no-op when partial has no registrationMode', async () => {
      doc.registrationMode = 'open';

      const { before, after } = await service.update({});

      expect(before.registrationMode).toBe('open');
      expect(after.registrationMode).toBe('open');
    });
  });
});
