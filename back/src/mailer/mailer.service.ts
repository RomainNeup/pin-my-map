import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendMail(options: SendMailOptions): Promise<void> {
    const host = process.env.SMTP_HOST;

    if (!host) {
      this.logger.log(
        `[MAILER] No SMTP_HOST set — would have sent email to ${options.to}: ${options.subject}\n${options.text ?? options.html}`,
      );
      return;
    }

    const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM ?? 'no-reply@pin-my-map.local';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
