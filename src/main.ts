import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);


  app.enableCors({
    origin: [
      "http://localhost:5173",
      "https://crm-tak-frontend.onrender.com"
    ],
    credentials: true,
  });


  await app.listen(3001);

}

bootstrap();