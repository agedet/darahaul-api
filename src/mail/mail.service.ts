import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { MailTemplateService } from './mail-template.service';
import * as path from 'path';
import * as fs from 'fs';
import {
  LoginOTPData,
  AccountActivationData,
  InvitationEmailData,
  OTPEmailData,
  SuperAdminInvitationData,
  WelcomeEmailData,
  PasswordResetData,
  TradingAccountIntegrationData,
} from './interfaces/mail-template.interface';

@Injectable()
export class MailService {
  private transporter: Mail;
  private readonly logger = new Logger(MailService.name);
  private readonly emailAttachments: Mail.Attachment[];

  constructor(
    private configService: ConfigService,
    private mailTemplateService: MailTemplateService,
  ) {
    let mailHost = this.configService.get('MAIL_HOST');
    const mailPort = this.configService.get('MAIL_PORT') || 587;
    const mailSecure = this.configService.get('MAIL_SECURE') === 'true';

    // Fix common hostname issues
    if (mailHost === 'gmail') {
      mailHost = 'smtp.gmail.com';
      this.logger.warn(
        'MAIL_HOST was set to "gmail", automatically corrected to "smtp.gmail.com"',
      );
    }

    if (!mailHost) {
      this.logger.error(
        'MAIL_HOST is not configured. Please set MAIL_HOST environment variable.',
      );
      throw new Error('MAIL_HOST is required');
    }

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: Number(mailPort),
      secure: mailSecure,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },

      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
    });

    // Resolve assets path - check multiple possible locations
    // In dev: __dirname = apps/api-gateway/src/mail
    // In production: __dirname = dist/apps/api-gateway/src/mail (or similar)
    let assetsPath = path.join(__dirname, 'assets', 'images');

    // Fallback: if assets not found relative to __dirname, try process.cwd()
    if (!fs.existsSync(assetsPath)) {
      const alternativePath = path.join(
        process.cwd(),
        'apps',
        'api-gateway',
        'src',
        'mail',
        'assets',
        'images',
      );
      if (fs.existsSync(alternativePath)) {
        assetsPath = alternativePath;
      } else {
        // Try dist path
        const distPath = path.join(
          process.cwd(),
          'dist',
          'apps',
          'api-gateway',
          'src',
          'mail',
          'assets',
          'images',
        );
        if (fs.existsSync(distPath)) {
          assetsPath = distPath;
        } else {
          // Try src path
          const srcPath = path.join(
            process.cwd(),
            'src',
            'mail',
            'assets',
            'images',
          );
          if (fs.existsSync(srcPath)) {
            assetsPath = srcPath;
          } else {
            this.logger.warn(
              `Mail assets not found. Checked paths: ${assetsPath}, ${alternativePath}, ${distPath}, ${srcPath}`,
            );
          }
        }
      }
    }

    this.emailAttachments = [
      {
        filename: 'aitrader-logo.png',
        path: path.join(assetsPath, 'aitrader-logo.png'),
        cid: 'aitrader-logo',
      },
      {
        filename: 'envelope-left.png',
        path: path.join(assetsPath, 'envelope-left.png'),
        cid: 'envelope-left',
      },
      {
        filename: 'envelope-right.png',
        path: path.join(assetsPath, 'envelope-right.png'),
        cid: 'envelope-right',
      },
    ];

    void this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
    } catch (error) {
      this.logger.error('Failed to verify SMTP connection', error.stack);
    }
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    from?: string,
    attachments?: Mail.Attachment[],
  ): Promise<void> {
    try {
      const mailOptions: Mail.Options = {
        from: from || this.configService.get<string>('MAIL_FROM_EMAIL'),
        to,
        subject,
        html,
        attachments: attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${to} with subject "${subject}"`);
    } catch (error) {
      // Re-throw as InternalServerErrorException to be handled by NestJS's exception filter
      this.logger.error(
        `Failed to send email to ${to} ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to send email:' + error.message,
      );
    }
  }

  /**
   * Send welcome email with template
   */
  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void> {
    const html = this.mailTemplateService.generateWelcomeEmail(data);
    const subject = `Welcome to Darahaul - Account Verification Required`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Welcome email sent to ${to}`);
  }

  /**
   * Send invitation email with template
   */
  async sendInvitationEmail(
    to: string,
    data: InvitationEmailData,
  ): Promise<void> {
    const html = this.mailTemplateService.generateInvitationEmail(data);
    const subject = `You're invited to join ${data.firstName || 'Darahaul'}`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Invitation email sent to ${to}`);
  }

  /**
   * Send super admin invitation email with template
   */
  async sendSuperAdminInvitationEmail(
    to: string,
    data: SuperAdminInvitationData,
  ): Promise<void> {
    const html =
      this.mailTemplateService.generateSuperAdminInvitationEmail(data);
    const subject = `Admin Invitation - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Admin invitation email sent to ${to}`);
  }

  /**
   * Send login OTP email with template
   */
  async sendLoginOTPEmail(to: string, data: LoginOTPData): Promise<void> {
    const html = this.mailTemplateService.generateLoginOTPEmail(data);
    const subject = `Login Verification Required - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Login OTP email sent to ${to}`);
  }

  /**
   * Send password reset email with template
   */
  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetData,
  ): Promise<void> {
    const html = this.mailTemplateService.generatePasswordResetEmail(data);
    const subject = `Password Reset Request - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Password reset email sent to ${to}`);
  }

  /**
   * Send company admin welcome email with template
   */
  async sendCompanyAdminWelcomeEmail(
    to: string,
    data: WelcomeEmailData,
  ): Promise<void> {
    const html =
      this.mailTemplateService.generateCompanyAdminWelcomeEmail(data);
    const subject = `Welcome to Darahaul - Administrator Account`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Company admin welcome email sent to ${to}`);
  }

  /**
   * Send resend OTP email with template
   */
  async sendResendOTPEmail(to: string, data: OTPEmailData): Promise<void> {
    const html = this.mailTemplateService.generateResendOTPEmail(data);
    const subject = `New Verification Code - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Resend OTP email sent to ${to}`);
  }

  /**
   * Send account activation email with template
   */
  async sendAccountActivationEmail(
    to: string,
    data: AccountActivationData,
  ): Promise<void> {
    const html = this.mailTemplateService.generateAccountActivationEmail(data);
    const subject = `Account Activation Required - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Account activation email sent to ${to}`);
  }

  /**
   * Send OTP email (for backward compatibility)
   * @deprecated Use specific template methods instead
   */
  async sendOTPEmail(to: string, subject: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Roboto, Inter; max-width: 600px; margin: 0 auto;">
        <h2>Your OTP Code</h2>
        <p>Your OTP code is: <strong style="font-size: 24px; color: #667eea;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
    this.logger.log(`OTP email sent to ${to}`);
  }

  /**
   * Send trading account integration success email with template
   */
  async sendTradingAccountIntegrationSuccessEmail(
    to: string,
    data: TradingAccountIntegrationData,
  ): Promise<void> {
    const html =
      this.mailTemplateService.generateTradingAccountIntegrationSuccessEmail(
        data,
      );
    const subject = `Trading Account Connected - ${data.platform} - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Trading account integration success email sent to ${to}`);
  }

  /**
   * Send trading account integration failed email with template
   */
  async sendTradingAccountIntegrationFailedEmail(
    to: string,
    data: TradingAccountIntegrationData,
  ): Promise<void> {
    const html =
      this.mailTemplateService.generateTradingAccountIntegrationFailedEmail(
        data,
      );
    const subject = `Trading Account Integration Failed - ${data.platform} - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Trading account integration failed email sent to ${to}`);
  }

  /**
   * Send trading account disconnected email with template
   */
  async sendTradingAccountDisconnectedEmail(
    to: string,
    data: TradingAccountIntegrationData,
  ): Promise<void> {
    const html =
      this.mailTemplateService.generateTradingAccountDisconnectedEmail(data);
    const subject = `Trading Account Disconnected - ${data.platform} - Darahaul`;
    await this.sendMail(to, subject, html, undefined, this.emailAttachments);
    this.logger.log(`Trading account disconnected email sent to ${to}`);
  }
}