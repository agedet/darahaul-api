export interface UserEntity {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  country: string;
  date_of_birth: string;
  state: string;
  terms_accepted: boolean;
  password: string;
  role: string;
  otp_count?: number;
  otp_generated_at?: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  is_anonymous: boolean;
  instance_id?: string;
  email_confirmed_at: Date;
  last_sign_in_at?: Date;
}