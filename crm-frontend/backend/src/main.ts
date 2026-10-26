import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const production = process.env.NODE_ENV === 'production';

  if (production) {
    for (const key of ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGINS']) {
      if (!process.env[key]?.trim()) {
        throw new Error(`${key} is required in production`);
      }
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Import payloads may be large, so raise Express' default JSON limit.
  app.useBodyParser('json', {
    limit: process.env.JSON_BODY_LIMIT || '50mb',
  });

  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Local Vite origins are enabled only outside production.
  const developmentOrigins = production
    ? []
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
      ];

  const allowedOrigins = new Set([
    ...configuredOrigins,
    ...developmentOrigins,
  ]);

  app.enableCors({
    origin(origin, callback) {
      // Requests without an Origin header (e.g. server-to-server/CLI) are allowed.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      if (allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin is not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend is listening on port ${port}`);
}

bootstrap();
