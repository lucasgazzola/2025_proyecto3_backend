import { ApiProperty } from '@nestjs/swagger';

export class SubareaResponseDto {
  @ApiProperty({ example: '675a1c2f5b2c3d4e5f6a7b8c' })
  id: string;

  @ApiProperty({ example: 'Atención al cliente' })
  name: string;
}

export class AreaResponseDto {
  @ApiProperty({ example: '675a1c2f5b2c3d4e5f6a7b8c' })
  id: string;

  @ApiProperty({ example: 'Operaciones' })
  name: string;

  @ApiProperty({ type: [SubareaResponseDto] })
  subareas: SubareaResponseDto[];
}
