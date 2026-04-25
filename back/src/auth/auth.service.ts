import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { JoseService } from './jose.service';
import { UserService } from '../user/user.service';
import { ConfigService } from 'src/config/config.service';
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
    private configService: ConfigService,
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

    if (user.status && user.status !== 'active') {
      const reasonSuffix = user.rejectionReason
        ? `: ${user.rejectionReason}`
        : '';
      throw new ForbiddenException(`Account ${user.status}${reasonSuffix}`);
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
    const config = await this.configService.get();

    if (config.registrationMode === 'invite-only') {
      throw new ForbiddenException(
        'Registration is invite-only. Ask an admin for an invitation.',
      );
    }

    const userExists = await this.userService.exists(registerDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const password = await bcrypt.hash(registerDto.password, 10);
    const existingCount = await this.userService.count();
    const isFirstUser = existingCount === 0;

    // First user becomes admin (active). Otherwise, follow registrationMode.
    const status =
      !isFirstUser && config.registrationMode === 'approval-required'
        ? 'pending'
        : 'active';

    const user = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      password,
      role: isFirstUser ? 'admin' : 'user',
      status,
    });

    if (!user) {
      throw new BadRequestException('User could not be created');
    }
  }
}
