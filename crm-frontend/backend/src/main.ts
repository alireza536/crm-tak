import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Import payloads are processed in yielding batches; avoid Express' small default JSON limit.
  app.useBodyParser('json', { limit: '512mb' });

  app.enableCors();

  await app.listen(3001);

}
bootstrap();
import 'reflect-metadata';
import 'dotenv/config';
