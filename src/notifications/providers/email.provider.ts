import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

@Injectable()
export class EmailProvider {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailProvider.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPortValue = this.configService.get<string | number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASSWORD');
    this.fromEmail = this.configService.get<string>(
      'SMTP_FROM_EMAIL',
      'noreply@example.com',
    );
    const smtpPort =
      typeof smtpPortValue === 'number'
        ? smtpPortValue
        : Number.parseInt(smtpPortValue ?? '587', 10);
    const normalizedSmtpPort = Number.isNaN(smtpPort) ? 587 : smtpPort;

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP configuration is incomplete. Email notifications will be logged but not sent.',
      );
      // Create a test transporter that logs emails
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: normalizedSmtpPort,
        secure: normalizedSmtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Verify transporter configuration
      void this.transporter
        .verify()
        .then(() => {
          this.logger.log('SMTP connection successful');
        })
        .catch((error: Error & { code?: string; command?: string }) => {
          this.logger.error(
            `SMTP connection failed${error.code ? ` (${error.code})` : ''}: ${error.message}`,
          );

          if (error.command) {
            this.logger.error(`SMTP command: ${error.command}`);
          }
        });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${mailOptions.to}`);
      this.logger.debug(`Message ID: ${info.messageId}`);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendBulkEmails(
    emails: EmailOptions[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await this.sendEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  getFromEmail(): string {
    return this.fromEmail;
  }
}
