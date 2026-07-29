/**
 * Validate required production secrets at boot.
 * Development keeps fallbacks only when NODE_ENV !== 'production'.
 */
export function assertEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';

  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (isProd) {
    const missing: string[] = [];
    if (!jwtSecret || jwtSecret.includes('change-in-production') || jwtSecret === 'super-secret-jwt-key-change-in-production') {
      missing.push('JWT_SECRET');
    }
    if (!refreshSecret || refreshSecret.includes('change-in-production') || refreshSecret === 'super-secret-refresh-key-change-in-production') {
      missing.push('JWT_REFRESH_SECRET');
    }
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');

    if (missing.length) {
      throw new Error(
        `Missing or insecure environment variables in production: ${missing.join(', ')}. ` +
          'Set strong secrets before starting the server.',
      );
    }
  }
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-only-jwt-secret-not-for-production';
}

export function getJwtRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET || 'dev-only-refresh-secret-not-for-production';
}
