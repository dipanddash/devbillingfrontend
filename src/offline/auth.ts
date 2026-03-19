/**
 * Online-only auth stubs.
 */

export async function cacheAuthCredentials(
  _username: string,
  _password: string,
  _userData: unknown,
  _accessToken: string,
  _refreshToken: string,
): Promise<void> {
  return;
}

export async function offlineLogin(_username: string, _password: string): Promise<null> {
  return null;
}

export async function hasCachedCredentials(_username: string): Promise<boolean> {
  return false;
}

