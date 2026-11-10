import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WelcomeEmailData,
  InvitationEmailData,
  SuperAdminInvitationData,
  PasswordResetData,
  AccountActivationData,
  LoginOTPData,
  OTPEmailData,
  TradingAccountIntegrationData,
} from './interfaces/mail-template.interface';

export interface AssistanceOfferedData {
  firstName: string;
  companyName: string;
  requestSubject: string;
}

@Injectable()
export class MailTemplateService {
  constructor(private configService: ConfigService) {}

  private buildVerifyLink(email: string): string {
    const baseUrl = this.configService.get<string>('AUTH_BASE_URL');
    const path = this.configService.get<string>('VERIFY_OTP_PATH');
    const cleanBaseUrl = baseUrl?.replace(/\/+$/, '');
    const cleanPath = path?.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}?email=${encodeURIComponent(email)}`;
  }

  /**
   * Base email template with Darahaul branding.
   * This template uses Content-ID (CID) to embed local images.
   * Ensure you attach the images with matching CIDs in your mailer service.
   *
   * All styles are inlined for maximum email client compatibility.
   * Media queries are preserved in <style> tag for responsive support.
   */
  public getBaseTemplate(
    headerTitle: string,
    content: string,
    showFooterNote: boolean = true,
  ): string {
    const currentYear = new Date().getFullYear();

    // IMPORTANT: These are Content-IDs (CIDs) for embedded images.
    // They must match the CIDs provided in the 'attachments' array of your email sending options.
    const logoUrl = 'cid:aitrader-logo';
    const envelopeLeftUrl = 'cid:envelope-left';
    const envelopeRightUrl = 'cid:envelope-right';

    const footerNote = showFooterNote
      ? `If you have any questions, please contact our <a href="mailto:support@aitrader.com" style="color: #64748B; text-decoration: underline;">support team</a>`
      : `Thank you,<br>The Darahaul Support Team`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${headerTitle}</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
        </style>
        <![endif]-->
        <style type="text/css">
          /* Reset styles for email clients */
          body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table { border-collapse: collapse !important; }
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          
          /* Responsive styles - only media queries stay in style tag */
          @media screen and (max-width: 600px) {
            .container {
              width: 100% !important;
              max-width: 600px !important;
            }
            .content-padding {
              padding: 25px 15px !important;
            }
            .footer-padding {
              padding: 20px 15px !important;
            }
            .logo-image {
              width: 100px !important;
              height: auto !important;
            }
            .header-title {
              font-size: 18px !important;
              line-height: 24px !important;
            }
            .header-deco-left {
              width: 70px !important;
              padding-left: 3px !important;
            }
            .header-deco-right {
              width: 70px !important;
              padding: 8px 0 0 0 !important;
            }
            .button-primary {
              display: block !important;
              width: 100% !important;
              padding: 15px 0 !important;
              box-sizing: border-box !important;
            }
            .header-image {
              width: 60px !important;
              height: auto !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f4; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
        <!-- Full width background table -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f4; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
          <tr>
            <td align="center" style="padding: 0; margin: 0;">
              <!-- Main container table -->
              <table role="presentation" class="container" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                
                <!-- Logo section -->
                <tr>
                  <td align="center" style="padding: 20px 0; margin: 0;">
                    <img src="${logoUrl}" alt="Darahaul Logo" width="138" height="auto" class="logo-image" style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 138px; height: auto;">
                  </td>
                </tr>
                
                <!-- Header with gradient background -->
                <tr>
                  <td style="padding: 0; margin: 0;">
                    <!--[if gte mso 9]>
                    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
                    <v:fill type="gradient" color="#8C52FF" color2="#CB6CE6" angle="90" />
                    <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
                    <![endif]-->
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #8C52FF; background-image: linear-gradient(179.04deg, #8C52FF 0.83%, #CB6CE6 108.86%); border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                      <tr>
                        <!-- Left decoration -->
                        <td align="left" valign="top" class="header-deco-left" style="width: 120px; padding: 19px 0 0 3px; margin: 0; vertical-align: top;">
                          <img src="${envelopeLeftUrl}" alt="" width="109" height="auto" class="header-image" style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 109px; height: auto;">
                        </td>
                        
                        <!-- Header title -->
                        <td align="center" valign="middle" style="padding: 0 10px; margin: 0; vertical-align: middle;">
                          <h1 class="header-title" style="margin: 0; padding: 0; color: #ffffff; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 24px; font-weight: bold; line-height: 28px; text-align: center; mso-line-height-rule: exactly;">
                            ${headerTitle}
                          </h1>
                        </td>
                        
                        <!-- Right decoration -->
                        <td align="right" valign="top" class="header-deco-right" style="width: 115px; padding: 13px 0 0 0; margin: 0; vertical-align: top;">
                          <img src="${envelopeRightUrl}" alt="" width="105" height="auto" class="header-image" style="display: block; border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 105px; height: auto;">
                        </td>
                      </tr>
                    </table>
                    <!--[if gte mso 9]>
                    </v:textbox>
                    </v:rect>
                    <![endif]-->
                  </td>
                </tr>
                
                <!-- Main content section -->
                <tr>
                  <td class="content-padding" style="padding: 30px 40px; margin: 0; color: #020617; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6; mso-line-height-rule: exactly;">
                    ${content}
                  </td>
                </tr>
                
                <!-- Footer section -->
                <tr>
                  <td class="footer-padding" style="padding: 20px 40px; margin: 0; background-color: #f8f9fa; text-align: center; color: #64748B; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; mso-line-height-rule: exactly;">
                    <p style="margin: 0 0 10px 0; padding: 0; color: #64748B; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; text-align: center;">${footerNote}</p>
                    <p style="margin: 0; padding: 0; color: #64748B; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; text-align: center;">&copy; ${currentYear} Darahaul. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private generateOtpAndButton(
    otp: string,
    link: string,
    expiryMinutes: number,
  ): string {
    return `
      <p style="margin: 30px 0 10px 0; padding: 0; text-align: left; font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #020617; font-family: 'Roboto', Arial, Helvetica, sans-serif; line-height: 1.2; mso-line-height-rule: exactly;">
        ${otp}
      </p>
      <p style="margin: 0 0 30px 0; padding: 0; text-align: left; color: #64748B; font-size: 14px; font-family: 'Roboto', Arial, Helvetica, sans-serif; line-height: 1.5; mso-line-height-rule: exactly;">
        This verification code expires in ${expiryMinutes} minutes
      </p>
      <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
        <tr>
          <td align="center" style="padding: 0; margin: 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${link}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="11%" stroke="f" fillcolor="#FFC951">
            <w:anchorlock/>
            <center style="color:#5442A5;font-family:'Roboto',Arial,sans-serif;font-size:16px;font-weight:bold;">Verify your account</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${link}" target="_blank" class="button-primary" style="display: inline-block; padding: 12px 25px; margin: 0; background-color: #FFC951; color: #5442A5; text-decoration: none; border-radius: 5px; font-family: 'Roboto', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; text-align: center; line-height: 1.5; mso-hide: all;">
              Verify your account
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
    `;
  }

  generateCompanyAdminWelcomeEmail(data: WelcomeEmailData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${fullName || 'there'}</p>
      <p style="margin: 0 0 20px 0;">Your administrator account has been successfully created. Here are your account details;</p>
      <p style="margin: 0;"><strong>Name:</strong> ${fullName}</p>
      <p style="margin: 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin: 0 0 20px 0;"><strong>Access Level:</strong> Administrator</p>
      <p style="margin: 0 0 20px 0;">After verification, you'll be able to:</p>
      <ul style="margin: 0 0 20px 0; padding-left: 20px;">
        <li style="margin-bottom: 5px;">Access your dashboard</li>
        <li>Manage team members and settings</li>
      </ul>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
    `;

    return this.getBaseTemplate(
      'WELCOME TO AI TRADER, ADMINISTRATOR!',
      content,
    );
  }

  generateLoginOTPEmail(data: LoginOTPData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName}</p>
      <p style="margin: 0 0 20px 0;">A Login attempt was made to your Darahaul account. Please use the verification code below to complete your login.</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        If you didn't attempt to log in, please contact our support team immediately.
      </p>
    `;

    return this.getBaseTemplate('LOGIN VERIFICATION REQUIRED', content);
  }

  generateSuperAdminInvitationEmail(data: SuperAdminInvitationData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName} ${data.lastName}</p>
      <p style="margin: 0 0 20px 0;">You have been invited to join Darahaul as a <strong>${data.role}</strong> by ${data.inviterRole}.</p>
      <p style="margin: 0 0 20px 0;">Use the verification code below to accept the invitation and activate your super admin access.</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
    `;

    return this.getBaseTemplate('SUPER ADMIN INVITATION', content);
  }

  generateResendOTPEmail(data: OTPEmailData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName}</p>
      <p style="margin: 0 0 20px 0;">A new verification code was requested for your account. Use the code below to continue.</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        If you didn't request this code, please contact our support team.</p>
    `;

    return this.getBaseTemplate('NEW VERIFICATION CODE', content);
  }

  generateAccountActivationEmail(data: AccountActivationData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${fullName || 'there'}</p>
      <p style="margin: 0 0 20px 0;">Your account requires activation to access Darahaul features as a <strong>${data.role}</strong>.</p>
      <p style="margin: 0;"><strong>Name:</strong> ${fullName}</p>
      <p style="margin: 0 0 20px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin: 0 0 20px 0;">Please use the verification code below to activate your account.</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
    `;

    return this.getBaseTemplate('ACCOUNT ACTIVATION REQUIRED', content);
  }

  generateAssistanceOfferedEmail(data: AssistanceOfferedData): string {
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName}</p>
      <p style="margin: 0 0 20px 0;">This is a notification to inform you that assistance has been offered for one of your company's requests. The Support team is now looking into it</p>
      <p style="margin: 0;"><strong>Company:</strong> ${data.companyName}</p>
      <p style="margin: 0 0 20px 0;"><strong>Request Subject:</strong> ${data.requestSubject}</p>
      <p style="margin: 0 0 20px 0;">You will be contacted shortly with an update. No further action is needed from you at this time.</p>
    `;

    return this.getBaseTemplate('ASSISTANCE OFFERED FOR YOUR REQUEST', content);
  }

  generateInvitationEmail(data: InvitationEmailData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const companyLine = data.firstName
      ? `<p style="margin: 0;"><strong>First Name:</strong> ${data.firstName}</p>`
      : '';
    const lastNameLine = data.lastName
      ? `<p style="margin: 0;"><strong>Last Name:</strong> ${data.lastName}</p>`
      : '';
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName} ${data.lastName}</p>
      <p style="margin: 0 0 20px 0;">${data.inviterName} has invited you to join Darahaul as a <strong>${data.role}</strong>.</p>
      ${companyLine}
      ${lastNameLine}
      <p style="margin: 0 0 20px 0;">Use the verification code below to accept the invitation and complete your account setup.</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
    `;

    return this.getBaseTemplate('YOU ARE INVITED TO AI TRADER', content);
  }

  generateWelcomeEmail(data: WelcomeEmailData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName}</p>
      <p style="margin: 0 0 20px 0;">Your account has been successfully created. Welcome to the future of financial management!</p>
      <p style="margin: 0;"><strong>Email:</strong> ${data.email}</p>
      ${data.firstName ? `<p style="margin: 0 0 20px 0;"><strong>First Name:</strong> ${data.firstName}</p>` : '<p style="margin: 0 0 20px 0;"></p>'}
      ${data.lastName ? `<p style="margin: 0 0 20px 0;"><strong>Last Name:</strong> ${data.lastName}</p>` : '<p style="margin: 0 0 20px 0;"></p>'}
      <p style="margin: 0 0 20px 0;">To complete your account setup, please use the verification code below:</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
    `;
    return this.getBaseTemplate('WELCOME TO AI TRADER!', content);
  }

  generatePasswordResetEmail(data: PasswordResetData): string {
    const verifyLink = this.buildVerifyLink(data.email);
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${data.firstName}</p>
      <p style="margin: 0 0 20px 0;">We received a request to reset the password for your Darahaul account.</p>
      <p style="margin: 0 0 20px 0;">Use the verification code below to reset your password:</p>
      ${this.generateOtpAndButton(data.otp, verifyLink, data.expiryMinutes || 10)}
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        If you didn't request a password reset, please contact our support team immediately.
      </p>
    `;
    return this.getBaseTemplate('PASSWORD RESET REQUIRED', content);
  }

  generateTradingAccountIntegrationSuccessEmail(
    data: TradingAccountIntegrationData,
  ): string {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const integratedDate = data.integratedAt
      ? new Date(data.integratedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    const durationLine = data.durationLabel
      ? `<p style="margin: 0;"><strong>Time taken:</strong> ${data.durationLabel}</p>`
      : '';

    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${fullName || 'there'}</p>
      <p style="margin: 0 0 20px 0;">Great news! Your trading account has been successfully integrated with Darahaul.</p>
      <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #15803d; font-weight: bold;">✓ Integration Successful</p>
        <p style="margin: 0;"><strong>Platform:</strong> ${data.platform}</p>
        <p style="margin: 0;"><strong>Account:</strong> ${data.accountName}</p>
        ${data.accountId ? `<p style="margin: 0;"><strong>Account ID:</strong> ${data.accountId}</p>` : ''}
        <p style="margin: 0;"><strong>Connected at:</strong> ${integratedDate}</p>
        ${durationLine}
      </div>
      <p style="margin: 0 0 20px 0;">You can now start using Darahaul's features with your ${data.platform} account. Access your dashboard to begin trading.</p>
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        If you didn't initiate this integration, please contact our support team immediately.
      </p>
    `;
    return this.getBaseTemplate('TRADING ACCOUNT CONNECTED', content);
  }

  generateTradingAccountIntegrationFailedEmail(
    data: TradingAccountIntegrationData,
  ): string {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${fullName || 'there'}</p>
      <p style="margin: 0 0 20px 0;">We were unable to complete the integration of your trading account with Darahaul.</p>
      <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #dc2626; font-weight: bold;">✗ Integration Failed</p>
        <p style="margin: 0;"><strong>Platform:</strong> ${data.platform}</p>
        <p style="margin: 0;"><strong>Account:</strong> ${data.accountName}</p>
        ${
          data.durationLabel
            ? `<p style="margin: 10px 0 0 0;"><strong>Time taken:</strong> ${data.durationLabel}</p>`
            : ''
        }
        ${data.errorMessage ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${data.errorMessage}</p>` : ''}
      </div>
      <p style="margin: 0 0 20px 0;">Please check the following and try again:</p>
      <ul style="margin: 0 0 20px 0; padding-left: 20px;">
        <li style="margin-bottom: 5px;">Verify your API credentials are correct</li>
        <li style="margin-bottom: 5px;">Ensure your ${data.platform} account is active</li>
        <li style="margin-bottom: 5px;">Check that API access is enabled on your account</li>
        <li>Make sure your API key has the necessary permissions</li>
      </ul>
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        Need help? Contact our <a href="mailto:support@aitrader.com" style="color: #5442A5; text-decoration: underline;">support team</a> for assistance.
      </p>
    `;
    return this.getBaseTemplate('TRADING ACCOUNT INTEGRATION FAILED', content);
  }

  generateTradingAccountDisconnectedEmail(
    data: TradingAccountIntegrationData,
  ): string {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const content = `
      <p style="margin: 0 0 20px 0;">Hello, ${fullName || 'there'}</p>
      <p style="margin: 0 0 20px 0;">This is to confirm that your trading account has been disconnected from Darahaul.</p>
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; color: #b45309; font-weight: bold;">Trading account disconnected</p>
        <p style="margin: 0;"><strong>Platform:</strong> ${data.platform}</p>
        <p style="margin: 0;"><strong>Account:</strong> ${data.accountName}</p>
      </div>
      <p style="margin: 0 0 20px 0;">Trading and automated features for this account are now disabled. You can reconnect at any time from Settings → Platform integrations.</p>
      <p style="text-align: center; margin: 30px 0 0 0; color: #64748B; font-size: 14px;">
        If you didn't disconnect this account, please contact our <a href="mailto:support@aitrader.com" style="color: #5442A5; text-decoration: underline;">support team</a> immediately.
      </p>
    `;
    return this.getBaseTemplate('TRADING ACCOUNT DISCONNECTED', content);
  }
}