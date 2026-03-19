export type LoaderType = "global" | "page" | "section" | "silent";

export type RequestPurpose =
  | "userVisible"
  | "background"
  | "healthCheck"
  | "sync";

export interface RequestMeta {
  showLoader?: boolean;
  loaderType?: LoaderType;
  requestPurpose?: RequestPurpose;
}

export type RequestInitWithMeta = RequestInit & {
  meta?: RequestMeta;
};

const HEALTH_PATHS = ["/api/health/", "/api/sync/health/", "/api/sync/status/"];

function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof Request) return input.url;
  return String(input);
}

function parsePath(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function normalizeMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return String(init.method).toUpperCase();
  if (input instanceof Request && input.method) return String(input.method).toUpperCase();
  return "GET";
}

export function withRequestMeta(
  init: RequestInit | undefined,
  meta: RequestMeta,
): RequestInitWithMeta {
  return {
    ...(init ?? {}),
    meta: {
      ...((init as RequestInitWithMeta | undefined)?.meta ?? {}),
      ...meta,
    },
  };
}

export function resolveRequestMeta(
  input: RequestInfo | URL,
  init?: RequestInit,
  apiBase?: string,
): Required<RequestMeta> {
  const explicit = (init as RequestInitWithMeta | undefined)?.meta ?? {};
  const url = normalizeUrl(input);
  const path = parsePath(url);
  const method = normalizeMethod(input, init);
  const isApi =
    path.includes("/api/") || (Boolean(apiBase) && url.startsWith(String(apiBase)));

  let inferred: Required<RequestMeta> = {
    showLoader: false,
    loaderType: "silent",
    requestPurpose: "background",
  };

  if (isApi && method === "GET") {
    inferred = {
      showLoader: true,
      loaderType: "page",
      requestPurpose: "userVisible",
    };
  }

  if (HEALTH_PATHS.some((healthPath) => path.includes(healthPath))) {
    inferred = {
      showLoader: false,
      loaderType: "silent",
      requestPurpose: "healthCheck",
    };
  } else if (path.includes("/api/sync/")) {
    inferred = {
      showLoader: false,
      loaderType: "silent",
      requestPurpose: "sync",
    };
  }

  return {
    showLoader: explicit.showLoader ?? inferred.showLoader,
    loaderType: explicit.loaderType ?? inferred.loaderType,
    requestPurpose: explicit.requestPurpose ?? inferred.requestPurpose,
  };
}

export function shouldTrackGlobalLoader(
  input: RequestInfo | URL,
  init?: RequestInit,
  apiBase?: string,
): boolean {
  const meta = resolveRequestMeta(input, init, apiBase);
  return (
    meta.showLoader &&
    meta.loaderType === "global" &&
    meta.requestPurpose === "userVisible"
  );
}
