import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './schemas/project.schema';
import { User, UserSchema } from './schemas/user.schema';
import { Claim, ClaimSchema } from './schemas/claim.schema';
import { ClaimStateHistory, ClaimStateHistorySchema } from './schemas/claim-state-history.schema';
import { File, FileSchema } from './schemas/file.schema';
import { Area, AreaSchema } from './schemas/area.schema';
import { SubArea, SubAreaSchema } from './schemas/subarea.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: User.name, schema: UserSchema },
      { name: Claim.name, schema: ClaimSchema },
      { name: ClaimStateHistory.name, schema: ClaimStateHistorySchema },
      { name: File.name, schema: FileSchema },
      { name: Area.name, schema: AreaSchema },
      { name: SubArea.name, schema: SubAreaSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class MongooseSchemasModule {}
