import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const user = process.env.EMAIL_USER || '';
    const pass = process.env.EMAIL_PASS || '';
    if (user && pass && user !== 'your-email@gmail.com') {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: false,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Email not configured — skipping email sending');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[EMAIL] Would send to ${to}: ${subject}`);
      return;
    }
    const from = process.env.EMAIL_USER || 'noreply@tolumak.com';
    await this.transporter.sendMail({ from, to, subject, html });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const html = `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${url}" style="padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Verify Email</a>
      <p>Or copy this link: ${url}</p>
    `;
    await this.sendMail(to, 'Verify your Tolumak account', html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const html = `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${url}" style="padding:12px 24px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0;">Reset Password</a>
      <p>Or copy this link: ${url}</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    await this.sendMail(to, 'Reset your Tolumak password', html);
  }

  async sendOrderConfirmationEmail(to: string, orderNumber: string): Promise<void> {
    const html = `
      <h1>Order Confirmed!</h1>
      <p>Your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
      <p>We'll notify you when your order ships.</p>
    `;
    await this.sendMail(to, `Order #${orderNumber} confirmed`, html);
  }

  async sendOrderStatusUpdateEmail(to: string, orderNumber: string, status: string): Promise<void> {
    const html = `
      <h1>Order Update</h1>
      <p>Your order <strong>#${orderNumber}</strong> status has been updated to: <strong>${status}</strong>.</p>
    `;
    await this.sendMail(to, `Order #${orderNumber} ${status.toLowerCase()}`, html);
  }

  async sendContactNotification(dto: { name: string; email: string; subject: string; message: string }): Promise<void> {
    const to = process.env.CONTACT_EMAIL || process.env.EMAIL_USER || 'hello@tolumak.com';
    const html = `
      <h1>New contact form message</h1>
      <p><strong>From:</strong> ${dto.name} &lt;${dto.email}&gt;</p>
      <p><strong>Subject:</strong> ${dto.subject}</p>
      <p>${dto.message.replace(/\n/g, '<br/>')}</p>
    `;
    await this.sendMail(to, `[Contact] ${dto.subject}`, html);
  }
}
