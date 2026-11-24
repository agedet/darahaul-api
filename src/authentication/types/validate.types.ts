export interface ValidatedUser {
  id: string;
  email: string | undefined;
  // Add other properties that your user object should have
  // based on your Prisma users model
  created_at?: Date;
  updated_at?: Date;
  // Don't include sensitive fields like encrypted_password
}

export interface DatabaseUser {
  id: string;
  email: string | null;
  encrypted_password?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}