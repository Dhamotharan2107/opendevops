import type { Context } from 'hono';
import { createToken, hashPassword, comparePassword, needsRehash } from '../auth';
import { handleGoogleOAuth, handleGitHubOAuth } from '../auth/oauth';
import { UserRepository } from '../repositories/user';
import type { Env } from '../types';
import { registerSchema, loginSchema } from '../validators';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { generateId, now, successResponse, errorResponse } from '../utils/helpers';
import { verifyRecaptcha } from '../utils/recaptcha';

export async function register(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  }

  const { username, name, email, password, recaptchaToken } = parsed.data;
  if (recaptchaToken) {
    const valid = await verifyRecaptcha(recaptchaToken, c.env.RECAPTCHA_SECRET_KEY);
    if (!valid) throw new ValidationError('reCAPTCHA verification failed');
  }
  const repo = new UserRepository(c.env.DB);

  const existingEmail = await repo.findByEmail(email);
  if (existingEmail) {
    throw new ValidationError('Email already in use');
  }

  const existingUsername = await repo.findByUsername(username);
  if (existingUsername) {
    throw new ValidationError('Username already taken');
  }

  const passwordHash = await hashPassword(password);
  const user = await repo.create({
    id: generateId(),
    username,
    name,
    email,
    password_hash: passwordHash,
    auth_provider: 'email',
    skills: '',
    created_at: now(),
    updated_at: now(),
  });

  const token = await createToken(user.id, c.env.JWT_SECRET);
  user.password_hash = undefined;

  return c.json(successResponse({ token, user }), 201);
}

export async function login(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  }

  const { email, password, recaptchaToken } = parsed.data;
  if (recaptchaToken) {
    const valid = await verifyRecaptcha(recaptchaToken, c.env.RECAPTCHA_SECRET_KEY);
    if (!valid) throw new ValidationError('reCAPTCHA verification failed');
  }
  const repo = new UserRepository(c.env.DB);

  const user = await repo.findByEmail(email);
  if (!user || !user.password_hash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Transparently upgrade legacy (unsalted SHA-256) hashes to PBKDF2 on login.
  if (needsRehash(user.password_hash)) {
    try {
      await repo.update(user.id, { password_hash: await hashPassword(password) });
    } catch {
      // non-fatal — login still succeeds
    }
  }

  const token = await createToken(user.id, c.env.JWT_SECRET);
  user.password_hash = undefined;

  return c.json(successResponse({ token, user }));
}

export async function logout(c: Context) {
  return c.json(successResponse({ message: 'Logged out successfully' }));
}

export async function me(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const repo = new UserRepository(c.env.DB);
  const user = await repo.findById(userId);

  if (!user) {
    return c.json(errorResponse('User not found'), 404);
  }

  user.password_hash = undefined;
  return c.json(successResponse({ user }));
}

export async function googleAuth(c: Context<{ Bindings: Env }>) {
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${c.env.FRONTEND_URL}/signin/callback/auth/`,
    response_type: 'code',
    scope: 'openid email profile',
  });

  return c.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}

export async function googleCallback(c: Context<{ Bindings: Env }>) {
  const code = c.req.query('code');
  if (!code) {
    return c.json(errorResponse('Missing authorization code'), 400);
  }

  try {
    const user = await handleGoogleOAuth(code, c.env);
    const token = await createToken(user.id, c.env.JWT_SECRET);
    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/callback?token=${token}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google OAuth failed';
    return c.redirect(`${c.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(message)}`);
  }
}

export async function exchangeGoogleCode(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const { code } = body;
  if (!code) {
    return c.json(errorResponse('Missing authorization code'), 400);
  }
  try {
    const user = await handleGoogleOAuth(code, c.env);
    const token = await createToken(user.id, c.env.JWT_SECRET);
    return c.json(successResponse({ token, user }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Google OAuth failed';
    return c.json(errorResponse(message), 400);
  }
}

export async function githubAuth(c: Context<{ Bindings: Env }>) {
  const workerOrigin = new URL(c.req.url).origin;
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: `${workerOrigin}/api/auth/github/callback`,
    scope: 'read:user user:email',
  });

  return c.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
}

export async function githubCallback(c: Context<{ Bindings: Env }>) {
  const code = c.req.query('code');
  if (!code) {
    return c.json(errorResponse('Missing authorization code'), 400);
  }

  try {
    const user = await handleGitHubOAuth(code, c.env);
    const token = await createToken(user.id, c.env.JWT_SECRET);
    return c.redirect(
      `${c.env.FRONTEND_URL}/auth/callback?token=${token}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'GitHub OAuth failed';
    return c.redirect(`${c.env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(message)}`);
  }
}
