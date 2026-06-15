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

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}
