import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
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
  @HttpCode(200)
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
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterRequestDto): Promise<void> {
    return await this.authService.register(registerDto);
  }

  @Private()
  @Get('me')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  async me(@User('id') userId: string): Promise<UserProfileDto> {
    return this.userService.findProfile(userId);
  }
}
