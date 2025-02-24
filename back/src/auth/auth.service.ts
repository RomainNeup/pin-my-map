import { UnauthorizedException, BadRequestException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { LoginRequestDto, LoginResponseDto, RegisterRequestDto } from "src/auth/auth.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
        if (!loginDto.email || !loginDto.password) {
            let missingFields = [];
            if (!loginDto.email) {
                missingFields.push('email');
            }
            if (!loginDto.password) {
                missingFields.push('password');
            }
            
            let message = `Missing fields: ${missingFields.join(', ')}`;
            throw new BadRequestException(message);
        }

        const user = await this.userService.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return {
            accessToken: await this.jwtService.signAsync({ name: user.name, email: user.email, id: user.id })
        }
    }

    async register(registerDto: RegisterRequestDto): Promise<void> {
        if (!registerDto.email || !registerDto.password || !registerDto.name) {
            let missingFields = [];
            if (!registerDto.email) {
                missingFields.push('email');
            }
            if (!registerDto.password) {
                missingFields.push('password');
            }
            if (!registerDto.name) {
                missingFields.push('name');
            }
            
            let message = `Missing fields: ${missingFields.join(', ')}`;
            throw new BadRequestException(message);
        }
        const userExists = await this.userService.exists(registerDto.email);

        if (userExists) {
            throw new BadRequestException('User already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(registerDto.password, salt);
        const user = await this.userService.create({
            name: registerDto.name,
            email: registerDto.email,
            password: password,
            salt: salt
        });

        if (!user) {
            throw new BadRequestException('User could not be created');
        }

        return;
    }

}