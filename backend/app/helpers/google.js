import g from 'google-auth-library';

// The frontend uses Google Identity Services' authorization-code popup flow,
// which uses the special redirect URI "postmessage".
export const googleClient = new g.OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage'
);

// Verify an ID token and return the identity in it. The audience check makes
// sure the token was issued for this app, not some other Google client.
export async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.email_verified) {
    throw new Error('Google account has no verified email');
  }
  return {
    id: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email,
    avatar: payload.picture ? payload.picture.replace('s96-c', 's512-c') : null,
  };
}

// Exchange a one-time authorization code (from the GIS popup) for tokens
// directly with Google, then verify the ID token.
export async function verifyGoogleAuthCode(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Missing Google authorization code');
  }
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token');
  }
  return verifyGoogleToken(tokens.id_token);
}
