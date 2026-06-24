import { UserRepository } from '../repositories/user';
import type { Env, User } from '../types';
import { generateId, now } from '../utils/helpers';

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export async function handleGoogleOAuth(
  code: string,
  env: Env,
): Promise<User> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.FRONTEND_URL}/signin/callback/auth/`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${errorBody}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  const accessToken = tokenData.access_token;

  const userResponse = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!userResponse.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const googleUser = (await userResponse.json()) as GoogleUser;
  const repo = new UserRepository(env.DB);

  let user = await repo.findByAuthProvider('google', googleUser.sub);

  if (!user) {
    user = await repo.findByEmail(googleUser.email);
    if (user) {
      await repo.update(user.id, {
        auth_provider: 'google',
        auth_provider_id: googleUser.sub,
      });
    } else {
      const baseUsername = googleUser.email.split('@')[0];
      const username = await generateUniqueUsername(repo, baseUsername);
      user = await repo.create({
        id: generateId(),
        username,
        name: googleUser.name,
        email: googleUser.email,
        auth_provider: 'google',
        auth_provider_id: googleUser.sub,
        avatar_url: googleUser.picture,
        skills: '',
        created_at: now(),
        updated_at: now(),
      });
    }
  }

  user.password_hash = undefined;
  return user;
}

export async function handleGitHubOAuth(
  code: string,
  env: Env,
): Promise<User> {
  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
      }),
    },
  );

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`GitHub token exchange failed: ${errorBody}`);
  }

  const tokenData = (await tokenResponse.json()) as { access_token: string };
  const accessToken = tokenData.access_token;

  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user info');
  }

  const githubUser = (await userResponse.json()) as GitHubUser;

  const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let email = githubUser.email;
  if (!email) {
    const emails = (await emailResponse.json()) as Array<{
      email: string;
      primary: boolean;
    }>;
    const primary = emails.find((e) => e.primary);
    email = primary?.email ?? emails[0]?.email;
  }

  const providerId = String(githubUser.id);
  const repo = new UserRepository(env.DB);

  let user = await repo.findByAuthProvider('github', providerId);

  if (!user) {
    user = await repo.findByEmail(email);
    if (user) {
      await repo.update(user.id, {
        auth_provider: 'github',
        auth_provider_id: providerId,
      });
    } else {
      const username = await generateUniqueUsername(repo, githubUser.login);
      user = await repo.create({
        id: generateId(),
        username,
        name: githubUser.name || githubUser.login,
        email,
        auth_provider: 'github',
        auth_provider_id: providerId,
        avatar_url: githubUser.avatar_url,
        skills: '',
        created_at: now(),
        updated_at: now(),
      });
    }
  }

  user.password_hash = undefined;
  return user;
}

async function generateUniqueUsername(
  repo: UserRepository,
  base: string,
): Promise<string> {
  let username = base;
  let attempt = 0;
  while (await repo.findByUsername(username)) {
    attempt++;
    username = `${base}${attempt}`;
  }
  return username;
}
