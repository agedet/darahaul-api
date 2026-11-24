// import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
//   @ApiProperty({
//     description: 'New password for the user',
//     example: 'NewSecurePassword123!',
//   })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;

//   @ApiProperty({
//     description: 'Confirm new password for the user',
//     example: 'NewSecurePassword123!',
//   })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  confirmNewPassword: string;
}