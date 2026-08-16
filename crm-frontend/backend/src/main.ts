import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {

  const production = process.env.NODE_ENV === 'production';
  if (production) {
    for (const key of ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGINS']) {
      if (!process.env[key]?.trim()) throw new Error(`${key} is required in production`);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Import payloads are processed in yielding batches; avoid Express' small default JSON limit.
  app.useBodyParser('json', { limit: process.env.JSON_BODY_LIMIT || '50mb' });

  const allowedOrigins=(process.env.CORS_ORIGINS||'http://localhost:5173').split(',').map(value=>value.trim()).filter(Boolean);
  app.enableCors({
    origin(origin,callback){
      if(!origin||allowedOrigins.includes(origin))return callback(null,true);
      callback(new Error('Origin is not allowed by CORS'),false);
    },
    credentials:true,
    methods:['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders:['Content-Type','Authorization'],
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');

}
bootstrap();
import 'reflect-metadata';
import 'dotenv/config';
