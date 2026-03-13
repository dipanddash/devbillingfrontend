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

const shouldSkipAuth = (url: string) =>
  AUTH_SKIP_PATHS.some((path) => url.includes(path));

const shouldSkipRetry = (url: string) =>
  shouldSkipAuth(url) || AUTH_NO_RETRY_PATHS.some((path) => url.includes(path));

const withAuthHeader = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string | null,
): [RequestInfo | URL, RequestInit | undefined] => {
  if (!token) return [input, init];

  if (input instanceof Request) {
    if (input.headers.has("Authorization")) return [input, init];
    const headers = new Headers(input.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return [new Request(input, { headers }), init];
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return [input, { ...init, headers }];
};

const refreshAccessToken = async (apiBase: string) => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  const res = await fetch(`${apiBase}/api/accounts/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const nextAccess = data?.access ? String(data.access) : null;
  if (nextAccess) localStorage.setItem("access", nextAccess);
  return nextAccess;
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

    const token = localStorage.getItem("access");
    const [firstInput, firstInit] = shouldSkipAuth(url)
      ? [input, init]
      : withAuthHeader(input, init, token);

    const firstResponse = await originalFetch(firstInput, firstInit);
    if (firstResponse.status !== 401 || shouldSkipRetry(url)) return firstResponse;

    const refreshed = await refreshAccessToken(apiBase);
    if (!refreshed) {
      onLogout();
      return firstResponse;
    }

    const [retryInput, retryInit] = withAuthHeader(
      input instanceof Request ? input.clone() : input,
      init,
      refreshed,
    );
    const retryResponse = await originalFetch(retryInput, retryInit);
    if (retryResponse.status === 401) {
      onLogout();
    }
    return retryResponse;
  };
};
