import {
  UnauthorizedException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JoseService } from './jose.service';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { AuditService } from '../audit/audit.service';
import { MailerService } from '../mailer/mailer.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
} from 'src/auth/auth.dto';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private joseService: JoseService,
    @InjectModel(User.name) private userModel: Model<User>,
    private auditService: AuditService,
    private mailerService: MailerService,
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

  async forgotPassword(email: string): Promise<void> {
    // Always returns 204 — never reveal whether the account exists.
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return;
    }

    const plainToken = randomBytes(32).toString('hex'); // 64 hex chars
    const tokenHash = sha256(plainToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${plainToken}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your Pin My Map password',
      html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      text: `Reset your password: ${resetLink}\n\nThis link expires in 1 hour.`,
    });

    try {
      await this.auditService.log({
        actor: (user._id as object).toString(),
        action: 'auth.password_reset_requested',
        targetType: 'user',
        targetId: (user._id as object).toString(),
      });
    } catch (err) {
      this.logger.warn(`Failed to audit password_reset_requested: ${err}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = sha256(token);

    const user = await this.userModel
      .findOne({ passwordResetTokenHash: tokenHash })
      .exec();

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      // Clear the stale token before throwing
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    try {
      await this.auditService.log({
        actor: (user._id as object).toString(),
        action: 'auth.password_reset_completed',
        targetType: 'user',
        targetId: (user._id as object).toString(),
      });
    } catch (err) {
      this.logger.warn(`Failed to audit password_reset_completed: ${err}`);
    }
  }
}
