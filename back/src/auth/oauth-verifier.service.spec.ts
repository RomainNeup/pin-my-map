import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthVerifierService } from './oauth-verifier.service';

jest.mock('jose', () => {
  const actual = jest.requireActual('jose');
  return {
    ...actual,
    createRemoteJWKSet: jest.fn(() => 'fake-jwks'),
    jwtVerify: jest.fn(),
  };
});

import { jwtVerify } from 'jose';

describe('OAuthVerifierService', () => {
  let service: OAuthVerifierService;

  beforeEach(() => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'gclient';
    process.env.APPLE_OAUTH_CLIENT_ID = 'aclient';
    service = new OAuthVerifierService();
    (jwtVerify as jest.Mock).mockReset();
  });

  it('verifies a valid Google ID token and returns claims', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: {
        sub: '12345',
        email: 'user@gmail.com',
        email_verified: true,
        name: 'User Name',
      },
    });

    const claims = await service.verify('google', 'good-token');

    expect(claims).toEqual({
      sub: '12345',
      email: 'user@gmail.com',
      emailVerified: true,
      name: 'User Name',
    });
    const call = (jwtVerify as jest.Mock).mock.calls[0];
    expect(call[2]).toEqual(
      expect.objectContaining({
        audience: 'gclient',
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
      }),
    );
  });

  it('throws Unauthorized on invalid token', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(new Error('signature failed'));
    await expect(service.verify('google', 'bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws Unauthorized on audience mismatch (jose surfaces JWTClaimValidationFailed)', async () => {
    (jwtVerify as jest.Mock).mockRejectedValue(
      new Error('unexpected "aud" claim value'),
    );
    await expect(service.verify('google', 'wrong-aud')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws ServiceUnavailable when client id is not configured', async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    const fresh = new OAuthVerifierService();
    await expect(fresh.verify('google', 'tok')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('uses the Apple issuer and audience for apple provider', async () => {
    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { sub: 'apple-sub', email: 'a@privaterelay.appleid.com' },
    });

    await service.verify('apple', 'tok');

    const call = (jwtVerify as jest.Mock).mock.calls[0];
    expect(call[2]).toEqual(
      expect.objectContaining({
        audience: 'aclient',
        issuer: ['https://appleid.apple.com'],
      }),
    );
  });
});
