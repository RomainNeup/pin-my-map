import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
} from 'src/auth/auth.dto';
import { JoseService } from './jose.service';
import {
  OAuthProvider,
  OAuthVerifierService,
  VerifiedOAuthClaims,
} from './oauth-verifier.service';
import { AuditService } from 'src/audit/audit.service';
import { UserService } from 'src/user/user.service';
import { User, UserDocument, UserStatus } from 'src/user/user.entity';

export type RegistrationMode = 'open' | 'approval-required' | 'invite-only';

function getRegistrationMode(): RegistrationMode {
  const raw = (process.env.REGISTRATION_MODE ?? 'open').toLowerCase();
  if (raw === 'approval-required' || raw === 'invite-only') return raw;
  return 'open';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private joseService: JoseService,
    private oauthVerifier: OAuthVerifierService,
    private auditService: AuditService,
    @InjectModel(User.name) private userModel: Model<User>,
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

  /**
   * Locate the local user matching this OIDC identity, link by email if found,
   * or create a new user honoring the configured registration mode.
   */
  private async findOrLinkOrCreate(
    provider: OAuthProvider,
    claims: VerifiedOAuthClaims,
  ): Promise<LoginResponseDto> {
    const providerField = provider === 'google' ? 'googleId' : 'appleSub';

    // 1. Existing user with this provider sub.
    let user: UserDocument | null = await this.userModel
      .findOne({ [providerField]: claims.sub })
      .exec();

    let createdNew = false;

    // 2. Existing user with same email -> link the provider id.
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

    // 3. Brand-new user -> apply registration mode policy.
    if (!user) {
      if (!claims.email) {
        throw new BadRequestException(
          'OAuth provider did not return an email address',
        );
      }

      const mode = getRegistrationMode();
      if (mode === 'invite-only') {
        throw new ForbiddenException('Registration is invite-only');
      }
      const status: UserStatus =
        mode === 'approval-required' ? 'pending' : 'active';

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

    // Pending users must wait for admin approval before they can sign in.
    if (user.status === 'pending') {
      throw new ForbiddenException(
        'Your account is pending administrator approval',
      );
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
