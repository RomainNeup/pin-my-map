import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';

export type OAuthProvider = 'google' | 'apple';

export interface VerifiedOAuthClaims {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
}

interface ProviderConfig {
  jwksUrl: string;
  issuers: string[];
  clientIdEnv: string;
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  google: {
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    issuers: ['https://accounts.google.com', 'accounts.google.com'],
    clientIdEnv: 'GOOGLE_OAUTH_CLIENT_ID',
  },
  apple: {
    jwksUrl: 'https://appleid.apple.com/auth/keys',
    issuers: ['https://appleid.apple.com'],
    clientIdEnv: 'APPLE_OAUTH_CLIENT_ID',
  },
};

/**
 * Verifies OIDC ID tokens issued by Google and Apple by fetching the
 * provider's JWKS and validating signature, issuer, audience, and expiry.
 */
@Injectable()
export class OAuthVerifierService {
  private readonly logger = new Logger(OAuthVerifierService.name);
  private readonly jwksCache = new Map<OAuthProvider, JWTVerifyGetKey>();

  async verify(
    provider: OAuthProvider,
    idToken: string,
  ): Promise<VerifiedOAuthClaims> {
    const config = PROVIDERS[provider];
    const audience = process.env[config.clientIdEnv];
    if (!audience) {
      this.logger.warn(
        `${config.clientIdEnv} is not configured; refusing OAuth login`,
      );
      throw new ServiceUnavailableException('OAuth provider not configured');
    }

    let payload: JWTPayload;
    try {
      const result = await jwtVerify(idToken, this.getJWKS(provider), {
        issuer: config.issuers,
        audience,
      });
      payload = result.payload;
    } catch (err) {
      this.logger.debug(
        `${provider} ID token verification failed: ${(err as Error).message}`,
      );
      throw new UnauthorizedException('Invalid OAuth token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('OAuth token missing subject');
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified:
        typeof payload.email_verified === 'boolean'
          ? payload.email_verified
          : payload.email_verified === 'true',
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  }

  private getJWKS(provider: OAuthProvider): JWTVerifyGetKey {
    const cached = this.jwksCache.get(provider);
    if (cached) return cached;
    const jwks = createRemoteJWKSet(new URL(PROVIDERS[provider].jwksUrl));
    this.jwksCache.set(provider, jwks);
    return jwks;
  }
}
