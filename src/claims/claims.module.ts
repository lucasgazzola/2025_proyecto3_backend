import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';
import { AuthModule } from '../auth/auth.module';
import { ClaimRepository } from './repositories/claim.repository';
import { CLAIM_REPOSITORY } from './repositories/claim.repository.interface';
import {
  ClaimStatus,
  ClaimPriority,
  ClaimCriticality,
  ClaimType,
} from '../common/enums/claims.enums';

@Module({
  imports: [
    MongooseSchemasModule,
    AuthModule,
    MulterModule.register({}),
  ],
  controllers: [ClaimsController],
  providers: [
    ClaimsService,
    {
      provide: CLAIM_REPOSITORY,
      useClass: ClaimRepository,
    },
  ],
})
export class ClaimsModule {}
