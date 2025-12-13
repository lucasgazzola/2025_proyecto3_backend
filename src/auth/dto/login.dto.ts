import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({ example: 'lucas@example.com' })
  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'lucasexample' })
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString()
  @MinLength(6)
  password: string;
}
