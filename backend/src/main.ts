import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertEnv } from './config/env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  assertEnv();

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // needed for payment webhook signature verification
  });

  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(',').map((url) => url.trim()).filter(Boolean),
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[];

  // Optional: keep production storefront in allowlist via env only
  if (process.env.NODE_ENV !== 'production') {
    // allow common local previews
  }

  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Tolumak Backend running on port ${port}`);
}
bootstrap();
