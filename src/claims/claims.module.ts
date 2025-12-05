import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';

@Module({
  imports: [MongooseSchemasModule],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
