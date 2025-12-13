import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/roles.enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan', description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret1' })
  @IsString()
  password: string;

  @ApiProperty({ example: '+549111223344', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: Role.USER, enum: Role, required: false })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    example: '64c3d4...',
    description: 'SubArea ObjectId as string',
  })
  @IsString()
  subArea?: string;
}
