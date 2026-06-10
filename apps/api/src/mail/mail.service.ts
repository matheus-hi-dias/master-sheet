import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

interface SendMailOptions {
  to?: string;
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
}

interface MailTransporter {
  sendMail(
    options: SendMailOptions,
  ): Promise<{ accepted?: string[]; messageId?: string }>;
}

@Injectable()
export class MailService {
  private transporter: MailTransporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const service = this.config.get<string>('SMTP_SERVICE');
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');

    if (service && user && pass) {
      this.transporter = nodemailer.createTransport({
        service,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Configured mail transporter for service ${service}`);
    } else if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: !!this.config.get<boolean>('SMTP_SECURE'),
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Configured SMTP mail transporter for ${host}:${port}`);
    } else {
      this.logger.warn(
        'SMTP not configured; falling back to logging transport',
      );
      this.transporter = null;
    }
  }

  async sendMail(options: SendMailOptions) {
    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail(options);
        this.logger.log(`Email sent to ${options.to}`);
        return result;
      } catch (e) {
        this.logger.error('Error sending email', e as Error);
        throw e;
      }
    }

    // Fallback: log the message body for development
    this.logger.log('--- Email (logged fallback) ---');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    if (options.text) this.logger.log(options.text);
    if (options.html) this.logger.log(options.html);
    this.logger.log('--- End Email ---');
    return { accepted: [String(options.to)], messageId: 'logged-fallback' };
  }

  async sendVerificationEmail(to: string, token: string) {
    const urlOne = this.config.get<string>('EMAIL_VERIFY_URL');
    const RawUrl =
      this.config.get<string>('EMAIL_VERIFY_REDIRECT_BASE') ||
      `${this.config.get<string>('APP_URL') ?? 'http://localhost:3000'}/auth/verify-email?token={{token}}`;
    const urlTwo = RawUrl.replace(
      '{{token}}',
      encodeURIComponent(token),
    ).replace('{token}', encodeURIComponent(token));

    return this.sendMail({
      to,
      subject: 'Verify your email',
      text: `Verify your email on Master Sheet`,
      html: `<p>Verify your email by visiting our page ${urlOne} and pasting your token ${token}.<br/>
      Or clicking <a href="${urlTwo}">here</a></p>`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const url = `${this.config.get<string>('APP_URL') ?? 'http://localhost:3000'}/auth/password-reset/confirm?token=${encodeURIComponent(
      token,
    )}`;
    return this.sendMail({
      to,
      subject: 'Reset your password',
      text: `Reset your password by visiting: ${url}`,
      html: `<p>Reset your password by clicking <a href="${url}">here</a></p>`,
    });
  }
}
