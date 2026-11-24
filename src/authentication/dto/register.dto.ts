import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
//   @ApiProperty({
//     description: 'User email address',
//     example: 'user@example.com',
//   })
  @IsEmail()
  email: string;

//   @ApiProperty({
//     description: 'User password (minimum 8 characters)',
//     example: 'SecurePassword123!',
//     minLength: 8,
//   })
  @IsString()
  @MinLength(8)
  password: string;

//   @ApiProperty({
//     description: 'User first name',
//     example: 'John',
//   })
  @IsString()
  first_name: string;

//   @ApiProperty({
//     description: 'User last name',
//     example: 'Doe',
//   })
  @IsString()
  last_name: string;

//   @ApiPropertyOptional({
//     description: 'User phone number',
//     example: '+1234567890',
//   })
  @IsOptional()
  @IsString()
  phone_number: string;

//   @ApiProperty({
//     description: 'job position of the user',
//     example: 'United States',
//   })
  @IsString()
  country: string;

//   @ApiProperty({
//     description: 'User state',
//     example: 'California',
//   })
  @IsString()
  state: string;

//   @ApiProperty({
//     description: 'User date of birth',
//     example: '1990-01-01',
//   })
  @Type(() => Date)
  @IsDate()
  date_of_birth: Date;

//   @ApiProperty({
//     description: 'User terms accepted',
//     example: true,
//   })
  @IsBoolean()
  terms_accepted: boolean;
}