import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseSchemasModule, AuthModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
