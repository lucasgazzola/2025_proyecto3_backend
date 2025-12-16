import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseSchemasModule,
    AuthModule,
    MulterModule.register({}),
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
