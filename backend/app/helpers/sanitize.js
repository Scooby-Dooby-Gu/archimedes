// Fields that must never leave the server, in any response.
const SECRET_KEYS = new Set([
  'hashedPassword', 'hashed_password',
  'salt',
  'verificationToken', 'verification_token',
]);

// The API key is the user's session credential. It may only be returned
// as part of the top-level `user` of an auth response (sign in, sign up,
// verification, password reset, /users/me), never nested elsewhere.
const API_KEY_KEYS = new Set(['apiKey', 'api_key']);

function scrub(value, keepApiKey, seen) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrub(item, false, seen));
  }

  const out = {};
  for (const key of Object.keys(value)) {
    if (SECRET_KEYS.has(key)) continue;
    if (API_KEY_KEYS.has(key) && !keepApiKey) continue;
    out[key] = scrub(value[key], false, seen);
  }
  return out;
}

export function sanitizeResponse(result) {
  if (result === null || typeof result !== 'object') return result;
  if (Buffer.isBuffer(result) || result instanceof Date) return result;
  if (Array.isArray(result)) {
    return scrub(result, false, new WeakSet());
  }
  const seen = new WeakSet();
  seen.add(result);
  const out = {};
  for (const key of Object.keys(result)) {
    if (SECRET_KEYS.has(key) || API_KEY_KEYS.has(key)) continue;
    out[key] = scrub(result[key], key === 'user', seen);
  }
  return out;
}
