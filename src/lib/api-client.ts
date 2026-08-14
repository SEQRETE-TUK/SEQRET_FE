const API_PREFIX = "/api/v1";

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  accessToken: string;
  headers?: HeadersInit;
}

export interface SignedUploadRequest {
  body: Blob;
  signal?: AbortSignal;
  uploadHeaders: Readonly<Record<string, string>>;
  uploadUrl: string;
}

export class ApiError extends Error {
  readonly detail: unknown;
  readonly requestId: string | null;
  readonly status: number;

  constructor(status: number, detail: unknown, requestId: string | null) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.detail = detail;
    this.requestId = requestId;
    this.status = status;
  }
}

export class SignedUploadError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Signed upload failed with status ${status}`);
    this.name = "SignedUploadError";
    this.status = status;
  }
}

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  let parsedBaseUrl: URL;
  try {
    parsedBaseUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error("VITE_API_BASE_URL must be an absolute URL");
  }

  if (
    !["http:", "https:"].includes(parsedBaseUrl.protocol) ||
    parsedBaseUrl.username ||
    parsedBaseUrl.password ||
    parsedBaseUrl.pathname !== "/" ||
    parsedBaseUrl.search ||
    parsedBaseUrl.hash
  ) {
    throw new Error("VITE_API_BASE_URL must be a plain HTTP(S) origin");
  }

  const localHttpHosts = new Set(["127.0.0.1", "[::1]", "localhost"]);
  if (
    parsedBaseUrl.protocol !== "https:" &&
    !localHttpHosts.has(parsedBaseUrl.hostname)
  ) {
    throw new Error("VITE_API_BASE_URL must use HTTPS outside local development");
  }

  return parsedBaseUrl.origin;
}

function resolveApiUrl(path: string): string {
  if (path !== API_PREFIX && !path.startsWith(`${API_PREFIX}/`)) {
    throw new Error(`API path must start with ${API_PREFIX}`);
  }

  return `${getApiBaseUrl()}${path}`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiRequest<T>(
  path: string,
  { accessToken, headers: providedHeaders, ...requestInit }: ApiRequestOptions,
): Promise<T> {
  const normalizedToken = accessToken.trim();
  if (!normalizedToken) {
    throw new Error("An access token is required");
  }

  const headers = new Headers(providedHeaders);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${normalizedToken}`);

  const response = await fetch(resolveApiUrl(path), {
    ...requestInit,
    cache: requestInit.cache ?? "no-store",
    credentials: "omit",
    headers,
    redirect: "error",
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseBody,
      response.headers.get("x-request-id"),
    );
  }

  return responseBody as T;
}

export async function uploadToSignedUrl({
  body,
  signal,
  uploadHeaders,
  uploadUrl,
}: SignedUploadRequest): Promise<void> {
  const response = await fetch(uploadUrl, {
    body,
    credentials: "omit",
    headers: uploadHeaders,
    method: "PUT",
    redirect: "error",
    signal,
  });

  if (!response.ok) {
    throw new SignedUploadError(response.status);
  }
}
