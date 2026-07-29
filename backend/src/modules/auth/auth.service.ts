import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { RegisterDto, LoginDto, UpdateProfileDto } from './auth.dto';
import { getJwtRefreshSecret, getJwtSecret } from '../../config/env';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /** Store only a hash of the refresh token (sha256 is enough for high-entropy JWTs). */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        verificationToken,
      },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    await this.emailService.sendVerificationEmail(dto.email, verificationToken);

    return { message: 'Registration successful. Please check your email to verify your account.', user };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account has been blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: this.hashToken(tokens.refreshToken) },
    });

    this.setRefreshCookie(res, tokens.refreshToken);

    const { password, refreshToken, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    return { accessToken: tokens.accessToken, user: safeUser };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return { message: 'Logged out successfully' };
  }

  async refresh(userId: string, refreshToken: string, res?: Response) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken || user.isBlocked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const incomingHash = this.hashToken(refreshToken);
    // Support one deploy window where old plaintext tokens may still exist
    const matches =
      user.refreshToken === incomingHash ||
      user.refreshToken === refreshToken;

    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: this.hashToken(tokens.refreshToken) },
    });

    if (res) {
      this.setRefreshCookie(res, tokens.refreshToken);
    }

    return { accessToken: tokens.accessToken };
  }

  /** Verify refresh JWT and rotate tokens */
  async refreshFromToken(refreshToken: string, res: Response) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: getJwtRefreshSecret(),
      }) as { sub: string };
      return this.refresh(payload.sub, refreshToken, res);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, verificationToken: null },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpires: resetExpires },
    });

    await this.emailService.sendPasswordResetEmail(email, resetToken);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true, avatar: true,
        role: true, isEmailVerified: true, isBlocked: true,
        createdAt: true, updatedAt: true,
        addresses: true,
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { ...dto },
      select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, updatedAt: true },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null },
    });

    return { message: 'Password updated successfully' };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: getJwtSecret(),
      expiresIn: process.env.JWT_EXPIRATION || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: getJwtRefreshSecret(),
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    return { accessToken, refreshToken };
  }
}
