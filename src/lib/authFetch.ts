type AuthFetchOptions = {
  apiBase: string;
  onLogout: () => void;
};

const AUTH_SKIP_PATHS = [
  "/api/accounts/login/",
  "/api/accounts/token/",
  "/api/accounts/token/refresh/",
];

const AUTH_NO_RETRY_PATHS = [
  "/api/accounts/logout/",
];

const PUBLIC_PATHS = [
  "/api/health/",
  "/api/sync/health/",
  "/api/sync/status/",
];

let refreshInFlight: Promise<string | null> | null = null;
let authBlockedUntil = 0;
let logoutNotifiedAt = 0;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 20_000;

const shouldSkipAuth = (url: string) =>
  AUTH_SKIP_PATHS.some((path) => url.includes(path)) ||
  PUBLIC_PATHS.some((path) => url.includes(path));

const shouldSkipRetry = (url: string) =>
  shouldSkipAuth(url) || AUTH_NO_RETRY_PATHS.some((path) => url.includes(path));

const isApiRequest = (url: string, apiBase: string) =>
  url.includes("/api/") || (Boolean(apiBase) && url.startsWith(apiBase));

const withAuthHeader = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string | null,
): [RequestInfo | URL, RequestInit | undefined] => {
  if (!token) return [input, init];

  if (input instanceof Request) {
    const headers = new Headers(input.headers);
    // Always override stale auth headers so refresh retries actually use
    // the latest access token.
    headers.set("Authorization", `Bearer ${token}`);
    return [new Request(input, { headers }), init];
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return [input, { ...init, headers }];
};

const clearStoredAuth = () => {
  try {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
  } catch {
    // ignore storage failures
  }
};

const decodeTokenExpiryMs = (token: string | null): number | null => {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const exp = Number(payload?.exp);
    if (!Number.isFinite(exp) || exp <= 0) return null;
    return exp * 1000;
  } catch {
    return null;
  }
};

const isTokenExpiredOrExpiring = (token: string | null) => {
  const expMs = decodeTokenExpiryMs(token);
  if (!expMs) return false;
  return expMs <= Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS;
};

const refreshAccessToken = async (apiBase: string, rawFetch: typeof fetch) => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  const res = await rawFetch(`${apiBase}/api/accounts/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const nextAccess = data?.access ? String(data.access) : null;
  const nextRefresh = data?.refresh ? String(data.refresh) : null;
  if (nextAccess) localStorage.setItem("access", nextAccess);
  if (nextRefresh) localStorage.setItem("refresh", nextRefresh);
  return nextAccess;
};

const notifyLogout = (onLogout: () => void) => {
  const now = Date.now();
  if (now - logoutNotifiedAt < 5_000) return;
  logoutNotifiedAt = now;
  onLogout();
};

const handleAuthFailure = (onLogout: () => void) => {
  authBlockedUntil = Date.now() + 30_000;
  clearStoredAuth();
  notifyLogout(onLogout);
};

export const createAuthFetch = (
  originalFetch: typeof fetch,
  { apiBase, onLogout }: AuthFetchOptions,
) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
        ? input.url
          : String(input);
    const method = String(init?.method ?? "GET").toUpperCase();
    const apiCall = isApiRequest(url, apiBase);

    if (Date.now() < authBlockedUntil && apiCall && !shouldSkipAuth(url)) {
      return new Response(
        JSON.stringify({ detail: "Authentication expired. Please login again.", code: "AUTH_EXPIRED" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    let token = localStorage.getItem("access");
    if (apiCall && !shouldSkipAuth(url) && !token) {
      handleAuthFailure(onLogout);
      return new Response(
        JSON.stringify({ detail: "Authentication required", code: "AUTH_MISSING" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    if (apiCall && !shouldSkipAuth(url) && isTokenExpiredOrExpiring(token)) {
      if (!refreshInFlight) {
        refreshInFlight = refreshAccessToken(apiBase, originalFetch).finally(() => {
          refreshInFlight = null;
        });
      }
      const refreshedToken = await refreshInFlight;
      if (!refreshedToken) {
        handleAuthFailure(onLogout);
        return new Response(
          JSON.stringify({ detail: "Session expired. Please login again.", code: "AUTH_EXPIRED" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      token = refreshedToken;
    }

    const [firstInput, firstInit] = shouldSkipAuth(url)
      ? [input, init]
      : withAuthHeader(input, init, token);

    let firstResponse: Response;
    try {
      firstResponse = await originalFetch(firstInput, firstInit);
    } catch {
      throw new Error("Network request failed.");
    }

    if (firstResponse.status !== 401 || shouldSkipRetry(url)) return firstResponse;

    if (!localStorage.getItem("refresh")) {
      handleAuthFailure(onLogout);
      return firstResponse;
    }

    if (!refreshInFlight) {
      refreshInFlight = refreshAccessToken(apiBase, originalFetch).finally(() => {
        refreshInFlight = null;
      });
    }

    const refreshed = await refreshInFlight;
    if (!refreshed) {
      handleAuthFailure(onLogout);
      return firstResponse;
    }

    const [retryInput, retryInit] = withAuthHeader(
      input instanceof Request ? input.clone() : input,
      init,
      refreshed,
    );
    let retryResponse: Response;
    try {
      retryResponse = await originalFetch(retryInput, retryInit);
    } catch {
      throw new Error("Network request failed.");
    }

    if (retryResponse.status === 401) {
      handleAuthFailure(onLogout);
    }
    return retryResponse;
  };
};
