import { mockApiEnabled, mockApiRequest } from "@/api/mock-api";

const API_PREFIX = "/api/v1";
const API_REQUEST_TIMEOUT_MS = 15_000;
const SIGNED_UPLOAD_PROXY_PATH = "/__seqret_signed_upload";

export interface ApiRequestOptions extends Omit<RequestInit, "headers"> {
  accessToken?: string;
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
  readonly retryAfterSeconds: number | null;
  readonly status: number;

  constructor(
    status: number,
    detail: unknown,
    requestId: string | null,
    retryAfterSeconds: number | null,
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.detail = detail;
    this.requestId = requestId;
    this.retryAfterSeconds = retryAfterSeconds;
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

let workspaceCsrfToken: string | null = null;

export function setWorkspaceCsrfToken(token: string | null): void {
  workspaceCsrfToken = token;
}

function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }

  if (configuredBaseUrl === "same-origin") {
    return window.location.origin;
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

function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after");
  if (!value) {
    return null;
  }
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

async function request<T>(
  path: string,
  requestInit: RequestInit,
  accessToken?: string,
): Promise<T> {
  if (mockApiEnabled) {
    return mockApiRequest<T>(path, requestInit, accessToken);
  }
  const headers = new Headers(requestInit.headers);
  headers.set("Accept", "application/json");
  if (accessToken !== undefined) {
    const normalizedToken = accessToken.trim();
    if (!normalizedToken) {
      throw new Error("An access token is required");
    }
    headers.set("Authorization", `Bearer ${normalizedToken}`);
  }
  const method = (requestInit.method ?? "GET").toUpperCase();
  if (!accessToken && !["GET", "HEAD", "OPTIONS"].includes(method) && workspaceCsrfToken) {
    headers.set("X-SEQRET-CSRF", workspaceCsrfToken);
  }

  const response = await fetch(resolveApiUrl(path), {
    ...requestInit,
    cache: "no-store",
    credentials: "include",
    headers,
    redirect: "error",
    signal: requestInit.signal
      ? AbortSignal.any([requestInit.signal, AbortSignal.timeout(API_REQUEST_TIMEOUT_MS)])
      : AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      responseBody,
      response.headers.get("x-request-id"),
      retryAfterSeconds(response),
    );
  }

  return responseBody as T;
}

export async function apiRequest<T>(
  path: string,
  { accessToken, headers: providedHeaders, ...requestInit }: ApiRequestOptions,
): Promise<T> {
  return request<T>(path, { ...requestInit, headers: providedHeaders }, accessToken);
}

export async function publicApiRequest<T>(
  path: string,
  requestInit: RequestInit,
): Promise<T> {
  return request<T>(path, requestInit);
}

export async function downloadApiFile(
  path: string,
  accessToken?: string,
): Promise<{ blob: Blob; filename: string }> {
  if (mockApiEnabled) {
    return { blob: new Blob(["SEQRET Mock 문서"], { type: "application/zip" }), filename: "seqret-documents.zip" };
  }
  const normalizedToken = accessToken?.trim();
  const response = await fetch(resolveApiUrl(path), {
    cache: "no-store",
    credentials: "include",
    headers: normalizedToken ? { Authorization: `Bearer ${normalizedToken}` } : undefined,
    redirect: "error",
    signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      await parseResponseBody(response),
      response.headers.get("x-request-id"),
      retryAfterSeconds(response),
    );
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "seqret-documents.zip";
  return { blob: await response.blob(), filename };
}

export async function uploadToSignedUrl({
  body,
  signal,
  uploadHeaders,
  uploadUrl,
}: SignedUploadRequest): Promise<void> {
  if (mockApiEnabled && uploadUrl.startsWith("mock-upload://")) return;
  const useLocalProxy = import.meta.env.DEV && typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const response = await fetch(useLocalProxy ? SIGNED_UPLOAD_PROXY_PATH : uploadUrl, {
    body,
    credentials: "omit",
    headers: useLocalProxy ? { ...uploadHeaders, "x-seqret-upload-url": uploadUrl } : uploadHeaders,
    method: "PUT",
    redirect: "error",
    signal,
  });

  if (!response.ok) {
    throw new SignedUploadError(response.status);
  }
}
