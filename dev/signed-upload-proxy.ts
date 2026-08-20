import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import {
  SignedUploadPolicyError,
  validateSignedUploadHeaders,
  validateSignedUploadTarget,
} from "../src/api/signed-upload-policy.ts";

export const SIGNED_UPLOAD_PROXY_PATH = "/__seqret_signed_upload";

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1_000;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);

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

export function isLoopbackRemoteAddress(remoteAddress: string | undefined): boolean {
  if (!remoteAddress) return false;
  const normalizedAddress = remoteAddress.toLowerCase();
  if (normalizedAddress === "::1") return true;

  const ipv4Address = normalizedAddress.startsWith("::ffff:")
    ? normalizedAddress.slice("::ffff:".length)
    : normalizedAddress;
  const octets = ipv4Address.split(".");
  return octets.length === 4
    && octets[0] === "127"
    && octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
}

function requireLoopbackSameOrigin(
  headers: IncomingHttpHeaders,
  remoteAddress: string | undefined,
): void {
  if (!isLoopbackRemoteAddress(remoteAddress)) {
    return rejectRequest(403, "Upload proxy is local-only");
  }
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

export function validatedUploadHeaders(
  headers: IncomingHttpHeaders,
): Readonly<Record<string, string>> {
  const contentType = singleHeader(headers, "content-type");
  const generationMatch = singleHeader(headers, "x-goog-if-generation-match");
  const contentLengthValue = headers["content-length"];

  if (typeof contentLengthValue !== "string" || !contentLengthValue) {
    return rejectRequest(411, "Content-Length is required");
  }
  if (!/^[1-9]\d*$/.test(contentLengthValue)) {
    return rejectRequest(400, "Invalid upload request");
  }

  const contentLength = Number(contentLengthValue);
  try {
    const uploadHeaders = validateSignedUploadHeaders(
      contentType,
      contentLength,
      {
        "content-type": contentType,
        "x-goog-if-generation-match": generationMatch,
      },
    );
    return {
      "Content-Length": contentLengthValue,
      ...uploadHeaders,
    };
  } catch (error) {
    if (error instanceof SignedUploadPolicyError) {
      return rejectRequest(error.statusCode, error.message);
    }
    throw error;
  }
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
      requireLoopbackSameOrigin(request.headers, request.socket.remoteAddress);
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
      if (
        error instanceof UploadProxyRequestError
        || error instanceof SignedUploadPolicyError
      ) {
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
