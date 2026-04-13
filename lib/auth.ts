import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";

const SESSION_COOKIE = "wedding_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function validateCredentials(
  username: string,
  password: string
): boolean {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// In-memory session store (resets on server restart - acceptable for this use case)
// For production with multiple instances, use Supabase table or Redis
const activeSessions = new Map<string, { expires: number }>();

export function createSession(token: string): void {
  activeSessions.set(token, {
    expires: Date.now() + SESSION_MAX_AGE * 1000,
  });
}

export function validateSession(token: string): boolean {
  const session = activeSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expires) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return validateSession(token);
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
