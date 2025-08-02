import { Body, Controller, HttpCode, HttpStatus, Post, Get, Query, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/Register.dto';
import { ApiBody, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dtos/Login.dto';
import { User } from '@prisma/client';
import { VerifyOtpDto } from './dtos/VerifyOTP.dto';
import { ResetPasswordDto } from './dtos/ResetPassword.dto';
import { RequestResetDto } from './dtos/RequestReset.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Your account has been registered successfully and is currently under review. You will be notified once the verification process is complete.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiBody({ type: LoginDto })
  @Post('login')
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged in' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid data' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('request-reset')
  @ApiBody({ type: RequestResetDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Identifier is missing or user not found',
  })
  async requestReset(@Body() requestResetDto: RequestResetDto): Promise<{ message: string }> {
    return this.authService.requestReset(requestResetDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired OTP',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<{ message: string }> {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-otp-link')
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully. Reset link sent.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired OTP',
  })
  async verifyOtpAndSendResetLink(
    @Headers('platform') header: string,
    @Body() verifyOtpDto: VerifyOtpDto
  ): Promise<{
    message: string;
  }> {
    return this.authService.verifyOtpAndSendResetLink(header, verifyOtpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password has been reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or password validation failed',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged out',
  })
  async logout(): Promise<{ message: string }> {
    return this.authService.logout();
  }
}
