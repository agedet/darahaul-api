// import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class VerifyOtpDto {
//   @ApiProperty({
//     description: 'User email address',
//     example: 'user@example.com',
//   })
  @IsEmail()
  email: string;

//   @ApiProperty({
//     description: 'One-Time Password (OTP) for verification',
//     example: '123456',
//   })
  @IsString()
  @IsNotEmpty()
  otp: string;
}