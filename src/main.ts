import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: allow frontend dev origin(s) or a configured origin via env
  const defaultAllowed = [
    'http://localhost:5173', // Vite dev
    'http://localhost:3000',
  ];
  const envOrigin = process.env.FRONTEND_ORIGIN;
  const allowedOrigins = envOrigin ? envOrigin.split(',').map((s) => s.trim()) : defaultAllowed;

  app.enableCors({
    origin: (origin, callback) => {
      // allow non-browser requests (e.g. curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Proyecto3 API')
    .setDescription('Documentación de la API de Proyecto 3')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('Error during application bootstrap:', err);
});
