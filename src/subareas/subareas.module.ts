import { Module } from '@nestjs/common';
import { SubareasService } from './subareas.service';
import { SubareasController } from './subareas.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';

@Module({
  imports: [MongooseSchemasModule],
  controllers: [SubareasController],
  providers: [SubareasService],
})
export class SubareasModule {}
