<<<<<<< HEAD
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;
=======
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  username: string;
>>>>>>> dev-backend

  @IsString()
  @MinLength(6)
  password: string;
}
