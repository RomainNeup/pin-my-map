import { Injectable, Logger } from '@nestjs/common';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const DEFAULT_EXPIRES_IN = '1h';
const DEV_FALLBACK_SECRET = 'secret';

const logger = new Logger('JoseService');

function getSecretKey(secret?: string): Uint8Array {
  if (secret) return new TextEncoder().encode(secret);
  const env = process.env.JWT_SECRET;
  if (env) return new TextEncoder().encode(env);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  logger.warn('JWT_SECRET not set; using development fallback');
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

interface VerifyOptions {
  secret?: string;
}

@Injectable()
export class JoseService {
  async signAsync(
    payload: Record<string, unknown>,
    expiresIn: string = DEFAULT_EXPIRES_IN,
  ): Promise<string> {
    return new SignJWT(payload as JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(getSecretKey());
  }

  async verifyAsync<T = JWTPayload>(
    token: string,
    options: VerifyOptions = {},
  ): Promise<T> {
    const { payload } = await jwtVerify(token, getSecretKey(options.secret), {
      algorithms: ['HS256'],
    });
    return payload as T;
  }
}
