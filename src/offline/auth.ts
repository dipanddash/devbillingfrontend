/**
 * Offline authentication using securely hashed credentials.
 *
 * Strategy:
 * - First login MUST be online (to verify against server).
 * - On successful online login, we hash the password with SHA-256 + salt
 *   and cache the user data + hash locally in SQLite.
 * - For offline login, we re-hash the entered password and compare.
 * - No plain passwords are ever stored.
 */
import { getDb, persistDb, queryOne, runQuery } from "./db";

/** Hash a password with a salt using SubtleCrypto SHA-256. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + ":" + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Use a fixed app-level salt. Not perfect but good enough for a desktop billing app.
// This prevents rainbow-table attacks while keeping the implementation simple.
const APP_SALT = "dip-dash-billing-offline-v1";

/**
 * Cache credentials after a successful online login.
 * Called from the login flow after server authentication succeeds.
 */
export async function cacheAuthCredentials(
  username: string,
  password: string,
  userData: Record<string, unknown>,
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await getDb();
  const passwordHash = await hashPassword(password, APP_SALT + username);

  runQuery(
    `INSERT OR REPLACE INTO auth_cache (username, password_hash, user_data, access_token, refresh_token, role, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      username,
      passwordHash,
      JSON.stringify(userData),
      accessToken,
      refreshToken,
      (userData.role as string) || "",
    ],
  );
  await persistDb();
}

/**
 * Attempt offline login using cached credentials.
 * Returns user data + cached tokens if valid, null otherwise.
 */
export async function offlineLogin(
  username: string,
  password: string,
): Promise<{
  userData: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
} | null> {
  await getDb();
  const cached = queryOne<{
    password_hash: string;
    user_data: string;
    access_token: string;
    refresh_token: string;
  }>("SELECT password_hash, user_data, access_token, refresh_token FROM auth_cache WHERE username = ?", [username]);

  if (!cached) return null;

  const enteredHash = await hashPassword(password, APP_SALT + username);
  if (enteredHash !== cached.password_hash) return null;

  try {
    return {
      userData: JSON.parse(cached.user_data),
      accessToken: cached.access_token,
      refreshToken: cached.refresh_token,
    };
  } catch {
    return null;
  }
}

/** Check if a user has cached credentials (for showing offline login hint). */
export async function hasCachedCredentials(username: string): Promise<boolean> {
  await getDb();
  const row = queryOne("SELECT 1 FROM auth_cache WHERE username = ?", [username]);
  return !!row;
}
