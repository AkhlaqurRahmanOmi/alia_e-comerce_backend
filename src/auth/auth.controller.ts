import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/signin.dto';
import { Auth } from './decorator/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { VerifyOtpDto } from './dtos/verify-otp.dto';
import { ResendOtpDto } from './dtos/resend-otp.dto';
import { RequestPasswordResetDto } from './dtos/request-password-reset.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SetPasswordDto } from './dtos/set-password.dto';
import { ActiveUser } from './decorator/active-user.decorator';
import type { ActiveUserData } from './interfaces/active-user-data.interface';
import { RelatedLinks } from 'src/shared/decorators/related-links.decorator';
import { CreateUserDto } from '../user/dtos/create-user.dto';
import { PasswordResetProvider } from './providers/password-reset.provider';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetProvider: PasswordResetProvider,
  ) {}

  @Post('register')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.CREATED)
  @RelatedLinks({
    verifyOtp: {
      path: '/api/v1/auth/verify-otp',
      method: 'POST',
      type: 'application/json',
      description: 'Verify your email with OTP',
    },
    resendOtp: {
      path: '/api/v1/auth/resend-otp',
      method: 'POST',
      type: 'application/json',
      description: 'Resend OTP if not received',
    },
  })
  public register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('verify-otp')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    profile: {
      path: '/api/v1/user/profile',
      method: 'GET',
      description: 'View your profile',
    },
    logout: {
      path: '/api/v1/auth/logout',
      method: 'POST',
      description: 'Logout from your account',
    },
  })
  public verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('resend-otp')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    verifyOtp: {
      path: '/api/v1/auth/verify-otp',
      method: 'POST',
      type: 'application/json',
      description: 'Verify your email with OTP',
    },
  })
  public resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post('sign-in')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    profile: {
      path: '/api/v1/user/profile',
      method: 'GET',
      description: 'View your profile',
    },
    logout: {
      path: '/api/v1/auth/logout',
      method: 'POST',
      description: 'Logout from your account',
    },
    refreshToken: {
      path: '/api/v1/auth/refresh-tokens',
      method: 'POST',
      type: 'application/json',
      description: 'Refresh your access token',
    },
  })
  public signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh-tokens')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  public refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    signIn: {
      path: '/api/v1/auth/sign-in',
      method: 'POST',
      type: 'application/json',
      description: 'Sign in again',
    },
  })
  public logout(@ActiveUser() user: ActiveUserData) {
    // In a stateless JWT system, logout is handled client-side by removing the token
    // However, we can return a success message and optionally invalidate refresh tokens
    return {
      message: 'Logged out successfully',
      userId: user.sub,
    };
  }

  @Post('request-password-reset')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    resetPassword: {
      path: '/api/v1/auth/reset-password',
      method: 'POST',
      type: 'application/json',
      description: 'Reset your password using the token from email',
    },
  })
  public async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
  ) {
    await this.passwordResetProvider.requestPasswordReset(
      requestPasswordResetDto.email,
    );
    return {
      message:
        'If an account with that email exists, a password reset link has been sent',
    };
  }

  @Post('reset-password')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    signIn: {
      path: '/api/v1/auth/sign-in',
      method: 'POST',
      type: 'application/json',
      description: 'Sign in with your new password',
    },
  })
  public async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.passwordResetProvider.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return {
      message: 'Password has been reset successfully',
    };
  }

  @Post('set-password')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @RelatedLinks({
    signIn: {
      path: '/api/v1/auth/sign-in',
      method: 'POST',
      type: 'application/json',
      description: 'Sign in with your new password',
    },
  })
  public async setPassword(@Body() setPasswordDto: SetPasswordDto) {
    await this.passwordResetProvider.setPasswordWithToken(
      setPasswordDto.token,
      setPasswordDto.password,
    );
    return {
      message:
        'Password has been set successfully. Your account is now activated.',
    };
  }
}
