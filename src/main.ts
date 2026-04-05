import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.enable('trust proxy');
  app.enableShutdownHooks();

  const origins = (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:4200']).map((s) =>
    s.trim().replace(/\/$/, ''),
  );
  console.log('--- RESTARTING BACKEND ---');
  console.log('Allowed CORS Origins:', origins);

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
      'upstash-signature',
    ],
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  console.log(`Backend is listening on port ${port}`);
}
bootstrap();
