import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';

@Module({
  imports: [MongooseSchemasModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
