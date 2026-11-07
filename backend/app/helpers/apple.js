import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_ISSUER = 'https://appleid.apple.com';

// Apple's public signing keys; jose caches and refreshes them.
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export function appleSigninEnabled() {
  return Boolean(process.env.APPLE_CLIENT_ID);
}

// Verify an Apple ID token (from Sign in with Apple JS) and return the
// identity in it. `keys` can be swapped out in tests.
export async function verifyAppleToken(idToken, { keys = appleKeys, audience = process.env.APPLE_CLIENT_ID } = {}) {
  if (!audience) {
    throw new Error('APPLE_CLIENT_ID is not configured');
  }
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Apple ID token');
  }
  const { payload } = await jwtVerify(idToken, keys, {
    issuer: APPLE_ISSUER,
    audience,
    algorithms: ['RS256'],
  });
  // Apple sends email_verified as a boolean or the string "true".
  const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
  if (!payload.sub || !payload.email || !emailVerified) {
    throw new Error('Apple account has no verified email');
  }
  return {
    id: payload.sub,
    email: String(payload.email).toLowerCase(),
    isPrivateEmail: payload.is_private_email === true || payload.is_private_email === 'true',
  };
}
