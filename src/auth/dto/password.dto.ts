import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
