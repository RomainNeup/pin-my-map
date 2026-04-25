import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AppleOAuthDto,
  GoogleOAuthDto,
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from 'src/auth/auth.dto';
import { AuthService } from 'src/auth/auth.service';
import { Private } from 'src/auth/auth.decorator';
import { User } from 'src/user/user.decorator';
import { UserProfileDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterRequestDto): Promise<void> {
    return await this.authService.register(registerDto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('oauth/google')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in / sign up with a Google ID token' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid OAuth token' })
  @ApiResponse({ status: 403, description: 'Registration not allowed' })
  @ApiResponse({ status: 503, description: 'OAuth provider not configured' })
  async loginWithGoogle(
    @Body() dto: GoogleOAuthDto,
  ): Promise<LoginResponseDto> {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('oauth/apple')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in / sign up with an Apple ID token' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid OAuth token' })
  @ApiResponse({ status: 403, description: 'Registration not allowed' })
  @ApiResponse({ status: 503, description: 'OAuth provider not configured' })
  async loginWithApple(@Body() dto: AppleOAuthDto): Promise<LoginResponseDto> {
    return this.authService.loginWithApple(dto.idToken, dto.name);
  }

  @Private()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async me(@User('id') userId: string): Promise<UserProfileDto> {
    return this.userService.findProfile(userId);
  }

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 204,
    description: 'Email sent if the account exists (no leak)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid token' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
