const GCS_HOST = "storage.googleapis.com";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_SIGNED_URL_LENGTH = 8_192;
const MAX_SIGNED_URL_TTL_SECONDS = 15 * 60;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "video/mp4"]);
const REQUIRED_SIGNED_HEADERS = new Set([
  "content-type",
  "host",
  "x-goog-if-generation-match",
]);
const REQUIRED_UPLOAD_HEADERS = new Set([
  "content-type",
  "x-goog-if-generation-match",
]);
const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;

export interface SignedUploadPolicyInput {
  bodyContentType: string;
  bodySize: number;
  uploadHeaders: unknown;
  uploadUrl: unknown;
}

export interface ValidatedSignedUploadRequest {
  uploadHeaders: Readonly<Record<string, string>>;
  uploadUrl: string;
}

export class SignedUploadPolicyError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number) {
    super("Invalid signed upload request");
    this.name = "SignedUploadPolicyError";
    this.statusCode = statusCode;
  }
}

function rejectPolicy(statusCode = 400): never {
  throw new SignedUploadPolicyError(statusCode);
}

function singleQueryParameter(url: URL, name: string): string {
  const values = url.searchParams.getAll(name);
  if (values.length !== 1 || !values[0]) {
    return rejectPolicy();
  }
  return values[0];
}

export function validateSignedUploadTarget(uploadUrl: unknown): asserts uploadUrl is string {
  if (
    typeof uploadUrl !== "string"
    || uploadUrl !== uploadUrl.trim()
    || uploadUrl.length === 0
    || uploadUrl.length > MAX_SIGNED_URL_LENGTH
  ) {
    return rejectPolicy();
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(uploadUrl);
  } catch {
    return rejectPolicy();
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
    return rejectPolicy();
  }

  if (singleQueryParameter(parsedUrl, "X-Goog-Algorithm") !== "GOOG4-RSA-SHA256") {
    return rejectPolicy();
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
    return rejectPolicy();
  }
}

export function validateSignedUploadHeaders(
  bodyContentType: string,
  bodySize: number,
  uploadHeaders: unknown,
): Readonly<Record<string, string>> {
  if (
    typeof uploadHeaders !== "object"
    || uploadHeaders === null
    || Array.isArray(uploadHeaders)
  ) {
    return rejectPolicy();
  }

  const normalizedHeaders = new Map<string, string>();
  for (const [name, value] of Object.entries(uploadHeaders)) {
    const normalizedName = name.toLowerCase();
    if (
      !HTTP_HEADER_NAME_PATTERN.test(name)
      || typeof value !== "string"
      || !REQUIRED_UPLOAD_HEADERS.has(normalizedName)
      || normalizedHeaders.has(normalizedName)
    ) {
      return rejectPolicy();
    }
    normalizedHeaders.set(normalizedName, value);
  }

  if (
    normalizedHeaders.size !== REQUIRED_UPLOAD_HEADERS.size
    || [...REQUIRED_UPLOAD_HEADERS].some((name) => !normalizedHeaders.has(name))
  ) {
    return rejectPolicy();
  }

  const contentType = normalizedHeaders.get("content-type");
  const generationMatch = normalizedHeaders.get("x-goog-if-generation-match");
  if (
    contentType === undefined
    || !ALLOWED_CONTENT_TYPES.has(contentType)
    || contentType !== bodyContentType
    || generationMatch !== "0"
    || !Number.isSafeInteger(bodySize)
    || bodySize <= 0
  ) {
    return rejectPolicy();
  }

  const maxBytes = contentType.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (bodySize > maxBytes) {
    return rejectPolicy(413);
  }

  return Object.freeze({
    "Content-Type": contentType,
    "x-goog-if-generation-match": generationMatch,
  });
}

export function validateSignedUploadRequest({
  bodyContentType,
  bodySize,
  uploadHeaders,
  uploadUrl,
}: SignedUploadPolicyInput): ValidatedSignedUploadRequest {
  validateSignedUploadTarget(uploadUrl);
  return Object.freeze({
    uploadHeaders: validateSignedUploadHeaders(bodyContentType, bodySize, uploadHeaders),
    uploadUrl,
  });
}
