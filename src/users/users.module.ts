import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';

@Module({
  imports: [MongooseSchemasModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
