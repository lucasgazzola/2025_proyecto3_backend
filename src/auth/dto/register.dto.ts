import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty({ example: 'maria@example.com', description: 'User email' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  email: string;

  @ApiProperty({ example: 'María', description: 'First name' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'González', description: 'Last name' })
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+5491122334455', required: false })
  @IsOptional()
  @IsString()
  tel?: string;

  @ApiProperty({ example: 'Secret1', description: 'Password (min 6 chars)' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsString()
  @Matches(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, {
    message: 'La contraseña no cumple los requisitos de seguridad',
  })
  password: string;

  @ApiProperty({ example: 'Secret1', description: 'Confirm password' })
  @IsNotEmpty({ message: 'La confirmación de contraseña no puede estar vacía' })
  @IsString()
  confirmPassword: string;
}
