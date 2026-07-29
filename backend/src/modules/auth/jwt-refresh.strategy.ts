import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { getJwtRefreshSecret } from '../../config/env';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken || null,
      ]),
      secretOrKey: getJwtRefreshSecret(),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string; role: string }) {
    const refreshToken = req?.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const matches =
      !!user?.refreshToken &&
      (user.refreshToken === hash || user.refreshToken === refreshToken);

    if (!user || !matches || user.isBlocked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { id: user.id, email: user.email, role: user.role, refreshToken };
  }
}
