import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MongooseSchemasModule } from './mongoose/mongoose-schemas.module';
import { AreasModule } from './areas/areas.module';
import { SubareasModule } from './subareas/subareas.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost/proyecto3',
        // optional: pass driver options
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
      }),
    }),
    MongooseSchemasModule,
    ClaimsModule,
    DashboardModule,
    ProjectsModule,
    AuthModule,
    UsersModule,
    AreasModule,
    SubareasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
