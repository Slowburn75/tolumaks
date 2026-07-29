import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { assertEnv } from './config/env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function buildAllowedOrigins(): string[] {
  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
  ]
    .map((u) => (u ? normalizeOrigin(u) : ''))
    .filter(Boolean);

  // Known production storefronts (safe defaults if env is incomplete on Render)
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://tolumaks.vercel.app',
    'https://www.tolumaks.vercel.app',
    'https://tolumak.com',
    'https://www.tolumak.com',
  ];

  return Array.from(new Set([...fromEnv, ...defaults]));
}

function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  if (allowed.includes(origin)) return true;

  // Optional: allow all Vercel preview deployments of this project
  // Set ALLOW_VERCEL_PREVIEWS=true on Render if you use preview deploys
  if (process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
    try {
      const host = new URL(origin).hostname;
      if (host.endsWith('.vercel.app')) return true;
    } catch {
      /* ignore */
    }
  }

  return false;
}

async function bootstrap() {
  assertEnv();
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.setGlobalPrefix('api');

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(cookieParser());

  const allowedOrigins = buildAllowedOrigins();
  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ') || '(none)'}`);

  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server / curl (no Origin header)
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      if (isAllowedOrigin(normalized, allowedOrigins)) {
        callback(null, true);
        return;
      }

      // Do NOT throw — that becomes a 500. Reject cleanly and log.
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
  logger.log(`Tolumak Backend running on port ${port}`);
}
bootstrap();
