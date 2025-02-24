import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from "src/auth/auth.dto";
import { AuthService } from "src/auth/auth.service";

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Login with credentials' })
    @ApiResponse({ status: 200, description: 'Login successful', type: LoginResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
        return await this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(201)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User registered' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async register(@Body() registerDto: RegisterRequestDto): Promise<void> {
        return await this.authService.register(registerDto);
    }
}