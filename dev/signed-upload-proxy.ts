import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

export const SIGNED_UPLOAD_PROXY_PATH = "/__seqret_signed_upload";

const GCS_HOST = "storage.googleapis.com";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_SIGNED_URL_LENGTH = 8_192;
const MAX_SIGNED_URL_TTL_SECONDS = 15 * 60;
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1_000;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "video/mp4"]);
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);
const REQUIRED_SIGNED_HEADERS = new Set([
  "content-type",
  "host",
  "x-goog-if-generation-match",
]);

interface SignedUploadRequestInit {
  body: AsyncIterable<Uint8Array>;
  duplex: "half";
  headers: Readonly<Record<string, string>>;
  method: "PUT";
  redirect: "error";
  signal: AbortSignal;
}

export type SignedUploadFetch = (
  input: string,
  init: SignedUploadRequestInit,
) => Promise<{ readonly status: number }>;

export class UploadProxyRequestError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "UploadProxyRequestError";
    this.statusCode = statusCode;
  }
}

function rejectRequest(statusCode: number, message: string): never {
  throw new UploadProxyRequestError(statusCode, message);
}

function singleHeader(headers: IncomingHttpHeaders, name: string): string {
  const value = headers[name];
  if (typeof value !== "string" || !value) {
    return rejectRequest(400, "Invalid upload request");
  }
  return value;
}

function singleQueryParameter(url: URL, name: string): string {
  const values = url.searchParams.getAll(name);
  if (values.length !== 1 || !values[0]) {
    return rejectRequest(400, "Invalid signed upload target");
  }
  return values[0];
}

function requireLoopbackSameOrigin(headers: IncomingHttpHeaders): void {
  const host = singleHeader(headers, "host");
  const origin = singleHeader(headers, "origin");

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return rejectRequest(403, "Upload proxy is local-only");
  }

  if (
    !["http:", "https:"].includes(parsedOrigin.protocol)
    || parsedOrigin.username
    || parsedOrigin.password
    || parsedOrigin.pathname !== "/"
    || parsedOrigin.search
    || parsedOrigin.hash
    || !LOCAL_HOSTNAMES.has(parsedOrigin.hostname)
    || parsedOrigin.host.toLowerCase() !== host.toLowerCase()
  ) {
    return rejectRequest(403, "Upload proxy is local-only");
  }
}

export function validateSignedUploadTarget(uploadUrl: string): void {
  if (
    uploadUrl !== uploadUrl.trim()
    || uploadUrl.length > MAX_SIGNED_URL_LENGTH
  ) {
    return rejectRequest(400, "Invalid signed upload target");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(uploadUrl);
  } catch {
    return rejectRequest(400, "Invalid signed upload target");
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isGcsHost = hostname === GCS_HOST || hostname.endsWith(`.${GCS_HOST}`);
  if (
    parsedUrl.protocol !== "https:"
    || parsedUrl.username
    || parsedUrl.password
    || parsedUrl.port
    || parsedUrl.hash
    || parsedUrl.pathname === "/"
    || !isGcsHost
  ) {
    return rejectRequest(400, "Invalid signed upload target");
  }

  if (singleQueryParameter(parsedUrl, "X-Goog-Algorithm") !== "GOOG4-RSA-SHA256") {
    return rejectRequest(400, "Invalid signed upload target");
  }

  const credential = singleQueryParameter(parsedUrl, "X-Goog-Credential");
  const signedAt = singleQueryParameter(parsedUrl, "X-Goog-Date");
  const expires = singleQueryParameter(parsedUrl, "X-Goog-Expires");
  const signedHeadersValue = singleQueryParameter(parsedUrl, "X-Goog-SignedHeaders");
  const signature = singleQueryParameter(parsedUrl, "X-Goog-Signature");
  const signedHeaders = signedHeadersValue.split(";");
  const signedHeaderSet = new Set(signedHeaders);
  const expiresSeconds = Number(expires);

  if (
    credential.length > 2_048
    || !/^\d{8}T\d{6}Z$/.test(signedAt)
    || !/^[1-9]\d{0,3}$/.test(expires)
    || !Number.isSafeInteger(expiresSeconds)
    || expiresSeconds > MAX_SIGNED_URL_TTL_SECONDS
    || signedHeaders.some((name) => name !== name.toLowerCase() || !name)
    || signedHeaderSet.size !== REQUIRED_SIGNED_HEADERS.size
    || [...REQUIRED_SIGNED_HEADERS].some((name) => !signedHeaderSet.has(name))
    || !/^[0-9a-f]{128,1024}$/i.test(signature)
  ) {
    return rejectRequest(400, "Invalid signed upload target");
  }
}

export function validatedUploadHeaders(
  headers: IncomingHttpHeaders,
): Readonly<Record<string, string>> {
  const contentType = singleHeader(headers, "content-type");
  const generationMatch = singleHeader(headers, "x-goog-if-generation-match");
  const contentLengthValue = headers["content-length"];

  if (typeof contentLengthValue !== "string" || !contentLengthValue) {
    return rejectRequest(411, "Content-Length is required");
  }
  if (!ALLOWED_CONTENT_TYPES.has(contentType) || generationMatch !== "0") {
    return rejectRequest(400, "Invalid upload request");
  }
  if (!/^[1-9]\d*$/.test(contentLengthValue)) {
    return rejectRequest(400, "Invalid upload request");
  }

  const contentLength = Number(contentLengthValue);
  const maxBytes = contentType.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!Number.isSafeInteger(contentLength) || contentLength > maxBytes) {
    return rejectRequest(413, "Upload is too large");
  }

  return {
    "Content-Length": contentLengthValue,
    "Content-Type": contentType,
    "x-goog-if-generation-match": generationMatch,
  };
}

function endResponse(response: ServerResponse, statusCode: number, message = ""): void {
  if (response.destroyed || response.writableEnded) return;

  response.statusCode = statusCode;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (message) {
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end(message);
    return;
  }
  response.setHeader("Content-Length", "0");
  response.end();
}

const defaultSignedUploadFetch: SignedUploadFetch = (input, init) => (
  fetch(input, init as unknown as RequestInit)
);

export function createSignedUploadProxyMiddleware(
  fetchUpload: SignedUploadFetch = defaultSignedUploadFetch,
): (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => Promise<void> {
  return async (request, response, next) => {
    if (request.method !== "PUT" || request.url !== SIGNED_UPLOAD_PROXY_PATH) {
      next();
      return;
    }

    try {
      requireLoopbackSameOrigin(request.headers);
      const uploadUrl = singleHeader(request.headers, "x-seqret-upload-url");
      validateSignedUploadTarget(uploadUrl);
      const uploadHeaders = validatedUploadHeaders(request.headers);
      const abortController = new AbortController();
      const abortUpload = () => abortController.abort();
      const timeout = setTimeout(abortUpload, UPLOAD_TIMEOUT_MS);
      timeout.unref();
      request.once("aborted", abortUpload);

      try {
        const upstream = await fetchUpload(uploadUrl, {
          body: request,
          duplex: "half",
          headers: uploadHeaders,
          method: "PUT",
          redirect: "error",
          signal: abortController.signal,
        });
        endResponse(response, upstream.status);
      } finally {
        clearTimeout(timeout);
        request.off("aborted", abortUpload);
      }
    } catch (error) {
      if (error instanceof UploadProxyRequestError) {
        endResponse(response, error.statusCode, error.message);
        return;
      }
      endResponse(response, 502, "Signed upload proxy failed");
    }
  };
}

export function signedUploadProxy(): Plugin {
  return {
    name: "seqret-signed-upload-proxy",
    configureServer(server) {
      server.middlewares.use(createSignedUploadProxyMiddleware());
    },
  };
}
