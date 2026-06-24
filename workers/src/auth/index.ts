import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const ALGORITHM = 'HS256';

export async function createToken(userId: string, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<JWTPayload> {
  const secretKey = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, secretKey);
  return payload;
}

// ── Password hashing ──────────────────────────────────────────────────────────
// Salted PBKDF2-HMAC-SHA256 (OWASP-recommended for environments without argon2/scrypt).
// Stored format: `pbkdf2$<iterations>$<saltHex>$<hashHex>`.
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEYLEN = 32; // bytes

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial, PBKDF2_KEYLEN * 8,
  );
  return toHex(bits);
}

// Legacy unsalted SHA-256 — kept ONLY so pre-existing accounts can still log in
// (and be transparently re-hashed). Never used to create new hashes.
async function legacySha256(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return toHex(buf);
}

// Constant-time string comparison.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt.buffer)}$${hash}`;
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2$')) {
    const [, iterStr, saltHex, hashHex] = stored.split('$');
    const iterations = parseInt(iterStr, 10);
    if (!iterations || !saltHex || !hashHex) return false;
    const computed = await pbkdf2(password, hexToBytes(saltHex), iterations);
    return timingSafeEqual(computed, hashHex);
  }
  // Legacy unsalted SHA-256 hash (64 hex chars) — verify for backward compatibility.
  const legacy = await legacySha256(password);
  return timingSafeEqual(legacy, stored);
}

// Returns true when a stored hash uses the deprecated legacy format and should be
// re-hashed on the next successful login.
export function needsRehash(stored: string): boolean {
  return !stored.startsWith('pbkdf2$');
}
