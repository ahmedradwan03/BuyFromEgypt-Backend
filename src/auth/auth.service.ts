import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dtos/Register.dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/Login.dto';
import { JwtService } from '@nestjs/jwt';
import { RequestResetDto } from './dtos/RequestReset.dto';
import { VerifyOtpDto } from './dtos/VerifyOTP.dto';
import { ResetPasswordDto } from './dtos/ResetPassword.dto';
import { MailService } from '../MailService/mail.service';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; message: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          { phoneNumber: registerDto.phoneNumber },
          { taxId: registerDto.taxId },
          { nationalId: registerDto.nationalId },
          { registrationNumber: registerDto.registrationNumber },
        ],
      },
    });

    const conflicts = {
      email: 'Email is already registered',
      phoneNumber: 'Phone number is already registered',
      taxId: 'Tax ID is already registered',
      nationalId: 'National ID is already registered',
      registrationNumber: 'Registration number is already registered',
    };

    for (const [field, message] of Object.entries(conflicts)) {
      if (existingUser?.[field] === registerDto[field]) {
        throw new UnauthorizedException(message);
      }
    }

    const hashedPassword: string = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const { password, ...safeUser } = newUser;

    return {
      message: 'Your account has been successfully created and is currently under review. You will be notified once the verification process is complete.',
      user: safeUser,
    };
  }

  async login(loginDto: LoginDto): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: loginDto.email },
      select: {
        userId: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        active: true,
        type: true,
        emailVerified: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('The email address is not registered. Please sign up first.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('The Email Or Password you entered is incorrect. Please try again.');
    }

    if (!user.active) {
      throw new ForbiddenException("Account under review. You'll be notified upon verification.");
    }

    const payload = { userId: user.userId, email: user.email, role: user.role, type: user.type, active: user.active };
    const token = await this.jwtService.signAsync(payload);
    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      token,
    };
  }

  async requestReset(requestResetDto: RequestResetDto): Promise<{ message: string }> {
    const { identifier } = requestResetDto;

    if (!identifier) {
      throw new UnauthorizedException('Identifier is required.');
    }

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phoneNumber: identifier }] },
    });

    if (!user) throw new UnauthorizedException('User not found.');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        userId: user.userId,
        otpCode,
        identifier,
        expiresAt,
      },
    });

    if (identifier.includes('@')) {
      await this.mailService.sendOtpEmail(user.email, otpCode);
    }

    return { message: 'OTP sent successfully.' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { identifier, otpCode } = verifyOtpDto;

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phoneNumber: identifier }] },
    });

    if (!user) throw new UnauthorizedException('User not found.');

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.userId,
        otpCode,
        identifier,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new UnauthorizedException('Invalid OTP.');
    if (new Date() > otpRecord.expiresAt) throw new UnauthorizedException('OTP has expired.');

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { emailVerified: true },
    });

    await this.prisma.otp.delete({ where: { id: otpRecord.id } });

    return { message: 'OTP verified successfully. Email has been verified.' };
  }

  async verifyOtpAndSendResetLink(header: string, verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    const { identifier, otpCode } = verifyOtpDto;

    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phoneNumber: identifier }] },
    });

    if (!user) throw new UnauthorizedException('User not found.');

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.userId,
        otpCode,
        identifier,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) throw new UnauthorizedException('Invalid OTP.');
    if (new Date() > otpRecord.expiresAt) throw new UnauthorizedException('OTP has expired.');

    const OTPGen = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.otp.update({
      where: { id: otpRecord.id },
      data: {
        otpCode: OTPGen,
        expiresAt: expiresAt,
      },
    });

    const isWeb = header === 'web';
    const baseURL = isWeb ? process.env.SITE_LINK : `http://localhost:${process.env.PORT ?? 3000}`;
    const path = isWeb ? '/auth/update-password' : '/reset-password';

    const resetLink = `${baseURL}${path}?token=${OTPGen}`;

    if (identifier.includes('@')) {
      await this.mailService.sendResetLink(user.email, resetLink);
    }

    return { message: 'OTP verified successfully. Reset link sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, identifier } = resetPasswordDto;

    const otpRecord = await this.prisma.otp.findFirst({
      where: { otpCode: token },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('Invalid reset token.');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('Reset token has expired.');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId: otpRecord.userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (identifier && otpRecord.identifier !== identifier) {
      throw new UnauthorizedException('Invalid reset request.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { userId: user.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.otp.delete({
        where: { id: otpRecord.id },
      }),
    ]);

    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }

  async logout(): Promise<{ message: string }> {
    return { message: 'Successfully logged out' };
  }
}
