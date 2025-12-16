import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/auth-roles.guard';
import { RolesGuard } from './auth/roles.guard';
import { MongooseSchemasModule } from './mongoose/mongoose-schemas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Sirve archivos estáticos desde /uploads como URLs públicas
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}