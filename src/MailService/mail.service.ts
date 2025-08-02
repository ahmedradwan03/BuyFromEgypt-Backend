import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CreateMailDto } from './dto/CreateMailDto';
import { mailConstants } from '../common/constants';
import { otpTemplate } from './templates/otp.template';
import { resetLinkTemplate } from './templates/reset-link.template';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: mailConstants.user,
        pass: mailConstants.pass,
      },
    });
  }

  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    const mailOptions = {
      from: `"Buy From Egypt" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP Code',
      html: otpTemplate(otpCode),
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendResetLink(email: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: `"Buy From Egypt" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset Link',
      html: resetLinkTemplate(resetLink),
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendMail(createMailDto: CreateMailDto): Promise<void> {
    const { to, subject, text, html } = createMailDto;

    const mailOptions = {
      from: `"Buy From Egypt" <${process.env.MAIL_USER}>`,
      to,
      subject,
      ...(text && { text }),
      ...(html && { html }),
    };

    await this.transporter.sendMail(mailOptions);
  }
}
