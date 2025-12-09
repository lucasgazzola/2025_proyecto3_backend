import { Module } from '@nestjs/common';
import { AreasService } from './areas.service';
import { AreasController } from './areas.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';

@Module({
  imports: [MongooseSchemasModule],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}
