import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import { HorsesService } from './horses/horses.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const horsesService = app.get(HorsesService);
  await horsesService.seedHorses();

  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true,
  });

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis(); // Connect to Redis
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3443);
}
bootstrap();
