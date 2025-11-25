import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsString()
  email: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString()
  @MinLength(6)
  password: string;
}
