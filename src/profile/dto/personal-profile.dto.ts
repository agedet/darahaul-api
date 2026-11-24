import { user_roles } from '@prisma/client';

export class ProfilePersonalDto {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  state: string;
  date_of_birth: Date;
  terms_accepted: boolean;
  password: string;
  role: user_roles[];
  otp_count?: number;
  otp_generated_at?: Date | null;
  email_confirmed_at?: Date | null;
  last_sign_in_at?: Date | null;
}

export class UpdatePersonalProfileDto {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  state: string;
  date_of_birth: Date;
  terms_accepted: boolean;
  password: string;
  role: user_roles[];
}