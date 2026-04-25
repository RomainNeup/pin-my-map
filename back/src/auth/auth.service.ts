import {
  UnauthorizedException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JoseService } from './jose.service';
import { UserService } from '../user/user.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
} from 'src/auth/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private joseService: JoseService,
  ) {}

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    let user;
    try {
      user = await this.userService.findByEmail(loginDto.email);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: await this.joseService.signAsync({
        name: user.name,
        email: user.email,
        id: user.id,
        role: user.role ?? 'user',
      }),
    };
  }

  async register(registerDto: RegisterRequestDto): Promise<void> {
    const userExists = await this.userService.exists(registerDto.email);

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const password = await bcrypt.hash(registerDto.password, 10);
    const existingCount = await this.userService.count();
    const user = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: password,
      role: existingCount === 0 ? 'admin' : 'user',
    });

    if (!user) {
      throw new BadRequestException('User could not be created');
    }

    return;
  }
}
