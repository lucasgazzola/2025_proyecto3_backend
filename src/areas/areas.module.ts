import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';
import { Area, AreaSchema } from '../mongoose/schemas/area.schema';
import { SubArea, SubAreaSchema } from '../mongoose/schemas/subarea.schema';
import { AREAS_REPOSITORY } from './repositories/areas.repository.interface';
import { AreasMongoRepository } from './repositories/areas.mongo.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Area.name, schema: AreaSchema },
			{ name: SubArea.name, schema: SubAreaSchema },
		]),
    AuthModule,
	],
	controllers: [AreasController],
	providers: [
		AreasService,
		{ provide: AREAS_REPOSITORY, useClass: AreasMongoRepository },
	],
	exports: [AreasService],
})
export class AreasModule {}