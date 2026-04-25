import { Test, TestingModule } from '@nestjs/testing';
import { MailerService } from './mailer.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = nodemailer.createTransport as jest.Mock;

describe('MailerService', () => {
  let service: MailerService;

  beforeEach(async () => {
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailerService],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;
  });

  describe('sendMail — no SMTP_HOST', () => {
    it('logs and returns without sending when SMTP_HOST is unset', async () => {
      delete process.env.SMTP_HOST;
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.sendMail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>hello</p>',
        text: 'hello',
      });

      expect(mockCreateTransport).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('user@example.com'),
      );
    });
  });

  describe('sendMail — with SMTP_HOST', () => {
    beforeEach(() => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'user';
      process.env.SMTP_PASS = 'pass';
      process.env.MAIL_FROM = 'no-reply@example.com';
    });

    it('creates a transporter and sends the mail', async () => {
      await service.sendMail({
        to: 'recipient@example.com',
        subject: 'Hello',
        html: '<p>world</p>',
      });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'Hello',
          from: 'no-reply@example.com',
        }),
      );
    });

    it('uses port 465 with secure=true', async () => {
      process.env.SMTP_PORT = '465';

      await service.sendMail({
        to: 'a@b.com',
        subject: 'S',
        html: '<p>x</p>',
      });

      expect(mockCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({ secure: true }),
      );
    });
  });
});
