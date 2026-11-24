export interface BaseEmailData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface OTPEmailData extends BaseEmailData {
  firstName: string;
  otp: string;
  expiryMinutes?: number;
}

export interface WelcomeEmailData extends OTPEmailData {
  role: string;
  firstName: string;
  lastName: string;
}

export interface InvitationEmailData extends OTPEmailData {
  inviterName: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface SuperAdminInvitationData extends OTPEmailData {
  role: string;
  inviterRole: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PasswordResetData extends OTPEmailData {
  // OTP-based password reset
}

export interface AccountActivationData extends OTPEmailData {
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginOTPData extends OTPEmailData {
  lastLoginTime?: Date;
  deviceInfo?: string;
}

export interface TradingAccountIntegrationData extends BaseEmailData {
  accountName: string;
  platform: string;
  accountId?: string;
  errorMessage?: string;
  integratedAt?: Date;
  durationMs?: number;
  durationLabel?: string;
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  INVITATION = 'invitation',
  ADMIN_INVITATION = 'admin_invitation',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_ACTIVATION = 'account_activation',
  LOGIN_OTP = 'login_otp',
  RESEND_OTP = 'resend_otp',
  COMPANY_ADMIN_WELCOME = 'company_admin_welcome',
  TRADING_ACCOUNT_INTEGRATION = 'trading_account_integration',
  TRADING_ACCOUNT_INTEGRATION_SUCCESS = 'trading_account_integration_success',
  TRADING_ACCOUNT_INTEGRATION_FAILED = 'trading_account_integration_failed',
  TRADING_ACCOUNT_INTEGRATION_PENDING = 'trading_account_integration_pending',
  TRADING_ACCOUNT_INTEGRATION_COMPLETED = 'trading_account_integration_completed',
  TRADING_ACCOUNT_INTEGRATION_CANCELLED = 'trading_account_integration_cancelled',
  TRADING_ACCOUNT_INTEGRATION_EXPIRED = 'trading_account_integration_expired',
  TRADING_ACCOUNT_INTEGRATION_REJECTED = 'trading_account_integration_rejected',
  TRADING_ACCOUNT_INTEGRATION_APPROVED = 'trading_account_integration_approved',
}