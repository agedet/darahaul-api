// import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordWithTokenDto {
//   @ApiProperty({
//     description: 'Reset password token sent to user email',
//     example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   })
  @IsString()
  @IsNotEmpty()
  token: string;

//   @ApiProperty({
//     description: 'New password for the user',
//     example: 'NewSecurePassword123!',
//   })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

//   @ApiProperty({
//     description: 'Confirm new password for the user',
//     example: 'NewSecurePassword123!',
//   })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  confirmNewPassword: string;
}