import {
  ForbiddenException,
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
import {
  OAuthProvider,
  OAuthVerifierService,
  VerifiedOAuthClaims,
} from './oauth-verifier.service';
import { UserService } from '../user/user.service';
import { ConfigService } from 'src/config/config.service';
import { User, UserDocument, UserStatus } from '../user/user.entity';
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
    private configService: ConfigService,
    private oauthVerifier: OAuthVerifierService,
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

    if (!user.password) {
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return;
    }

    const plainToken = randomBytes(32).toString('hex');
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

  async loginWithGoogle(idToken: string): Promise<LoginResponseDto> {
    const claims = await this.oauthVerifier.verify('google', idToken);
    return this.findOrLinkOrCreate('google', claims);
  }

  async loginWithApple(
    idToken: string,
    name?: string,
  ): Promise<LoginResponseDto> {
    const claims = await this.oauthVerifier.verify('apple', idToken);
    return this.findOrLinkOrCreate('apple', {
      ...claims,
      name: name ?? claims.name,
    });
  }

  private async findOrLinkOrCreate(
    provider: OAuthProvider,
    claims: VerifiedOAuthClaims,
  ): Promise<LoginResponseDto> {
    const providerField = provider === 'google' ? 'googleId' : 'appleSub';

    let user: UserDocument | null = await this.userModel
      .findOne({ [providerField]: claims.sub })
      .exec();

    let createdNew = false;

    if (!user && claims.email) {
      user = await this.userModel
        .findOne({ email: claims.email.toLowerCase() })
        .exec();
      if (user) {
        (user as unknown as Record<string, unknown>)[providerField] =
          claims.sub;
        await user.save();
      }
    }

    if (!user) {
      if (!claims.email) {
        throw new BadRequestException(
          'OAuth provider did not return an email address',
        );
      }

      const config = await this.configService.get();
      if (config.registrationMode === 'invite-only') {
        throw new ForbiddenException('Registration is invite-only');
      }
      const status: UserStatus =
        config.registrationMode === 'approval-required' ? 'pending' : 'active';

      const fallbackName =
        claims.name?.trim() || claims.email.split('@')[0] || 'User';
      const existingCount = await this.userModel.countDocuments().exec();

      const created = await this.userModel.create({
        name: fallbackName,
        email: claims.email.toLowerCase(),
        role: existingCount === 0 ? 'admin' : 'user',
        status,
        [providerField]: claims.sub,
      });
      user = created;
      createdNew = true;

      try {
        await this.auditService.log({
          actor: created.id,
          action: 'auth.oauth.register',
          targetType: 'user',
          targetId: created.id,
          meta: { provider, status },
        });
      } catch (err) {
        this.logger.warn(
          `Failed to audit oauth.register: ${(err as Error).message}`,
        );
      }
    }

    if (user.status && user.status !== 'active') {
      const reasonSuffix = user.rejectionReason
        ? `: ${user.rejectionReason}`
        : '';
      throw new ForbiddenException(`Account ${user.status}${reasonSuffix}`);
    }

    try {
      await this.auditService.log({
        actor: user.id,
        action: 'auth.oauth.login',
        targetType: 'user',
        targetId: user.id,
        meta: { provider, createdNew },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to audit oauth.login: ${(err as Error).message}`,
      );
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
}
