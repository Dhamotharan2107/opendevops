export async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success: boolean; score?: number };
    return data.success === true;
  } catch {
    return false;
  }
}