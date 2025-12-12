import { ApiProperty } from '@nestjs/swagger';
import { ProjectType } from '../../common/enums/projects.enums';

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ required: false }) description?: string;
  @ApiProperty({ enum: ProjectType }) projectType: ProjectType;

  @ApiProperty({
    type: () => ({
      email: String,
      firstName: String,
      lastName: String,
      role: String,
      phone: String,
    }),
  })
  user: any;

  @ApiProperty({ type: [String] }) claims: string[];
  @ApiProperty() registrationDate: Date;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ required: false }) deletedAt?: Date;
}
