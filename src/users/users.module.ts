import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseSchemasModule } from '../mongoose/mongoose-schemas.module';
import { USER_REPOSITORY } from './repositories/user.repository.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/mongoose/schemas/user.schema';
import { UserRepository } from './repositories/user.mongo.repository';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseSchemasModule,
    MongooseModule.forFeature([{ name: USER_REPOSITORY, schema: UserSchema }]),
    forwardRef(() => AuthModule),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
