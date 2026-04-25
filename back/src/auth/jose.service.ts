import { Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const DEFAULT_EXPIRES_IN = '1h';

function getSecretKey(secret?: string): Uint8Array {
  const value = secret ?? process.env.JWT_SECRET ?? 'secret';
  return new TextEncoder().encode(value);
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
    const { payload } = await jwtVerify(token, getSecretKey(options.secret));
    return payload as T;
  }
}
