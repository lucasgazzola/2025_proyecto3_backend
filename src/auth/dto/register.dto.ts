import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Role } from '../../common/enums/roles.enums';

export class RegisterAuthDto {
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsString()
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: 'La contraseña no cumple los requisitos de seguridad',
  })
  password: string;

  @IsNotEmpty({ message: 'La confirmación de contraseña no puede estar vacía' })
  @IsString()
  confirmPassword: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
