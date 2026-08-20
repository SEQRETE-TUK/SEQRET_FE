import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

import { validateApiProxyTarget } from "../../dev/api-proxy-target.ts";
import {
  createSignedUploadProxyMiddleware,
  isLoopbackRemoteAddress,
  SIGNED_UPLOAD_PROXY_PATH,
  type SignedUploadFetch,
  UploadProxyRequestError,
  validatedUploadHeaders,
} from "../../dev/signed-upload-proxy.ts";
import {
  SignedUploadPolicyError,
  validateSignedUploadRequest,
} from "../../src/api/signed-upload-policy.ts";

function signedUploadUrl(hostname = "storage.googleapis.com"): string {
  const query = new URLSearchParams({
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": "uploader@example.test/20260821/auto/storage/goog4_request",
    "X-Goog-Date": "20260821T000000Z",
    "X-Goog-Expires": "900",
    "X-Goog-SignedHeaders": "content-type;host;x-goog-if-generation-match",
    "X-Goog-Signature": "ab".repeat(256),
  });
  return `https://${hostname}/seqret-test/jobs/1/video.mp4?${query.toString()}`;
}

async function withProxyServer(
  fetchUpload: SignedUploadFetch,
  run: (origin: string) => Promise<void>,
): Promise<void> {
  const middleware = createSignedUploadProxyMiddleware(fetchUpload);
  const server = createServer((request, response) => {
    void middleware(request, response, () => {
      response.statusCode = 404;
      response.end();
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("blocks arbitrary HTTPS destinations before opening an upstream request", async () => {
  let upstreamCalls = 0;
  const fetchUpload: SignedUploadFetch = async () => {
    upstreamCalls += 1;
    return { status: 204 };
  };

  await withProxyServer(fetchUpload, async (origin) => {
    for (const target of [
      signedUploadUrl("example.com"),
      signedUploadUrl("storage.googleapis.com.attacker.test"),
      "https://storage.googleapis.com/seqret-test/video.mp4",
    ]) {
      const response = await fetch(`${origin}${SIGNED_UPLOAD_PROXY_PATH}`, {
        body: Buffer.from("video-bytes"),
        headers: {
          "Content-Type": "video/mp4",
          Origin: origin,
          "x-goog-if-generation-match": "0",
          "x-seqret-upload-url": target,
        },
        method: "PUT",
      });

      assert.equal(response.status, 400);
      assert.equal((await response.text()).includes(target), false);
    }
  });

  assert.equal(upstreamCalls, 0);
});

test("forwards only the signed GCS upload headers", async () => {
  const target = signedUploadUrl();
  let capturedUrl: string | undefined;
  let capturedHeaders: Headers | undefined;
  let capturedBody = Buffer.alloc(0);
  const fetchUpload: SignedUploadFetch = async (url, init) => {
    capturedUrl = url;
    capturedHeaders = new Headers(init.headers);
    const chunks: Uint8Array[] = [];
    for await (const chunk of init.body) chunks.push(chunk);
    capturedBody = Buffer.concat(chunks);
    return { status: 201 };
  };

  await withProxyServer(fetchUpload, async (origin) => {
    const response = await fetch(`${origin}${SIGNED_UPLOAD_PROXY_PATH}`, {
      body: Buffer.from("video-bytes"),
      headers: {
        Authorization: "Bearer must-not-leak",
        Cookie: "session=must-not-leak",
        "Content-Type": "video/mp4",
        Origin: origin,
        "X-Forwarded-For": "169.254.169.254",
        "x-goog-if-generation-match": "0",
        "x-seqret-upload-url": target,
      },
      method: "PUT",
    });

    assert.equal(response.status, 201);
  });

  assert.equal(capturedUrl, target);
  assert.deepEqual(Object.fromEntries(capturedHeaders?.entries() ?? []), {
    "content-length": "11",
    "content-type": "video/mp4",
    "x-goog-if-generation-match": "0",
  });
  assert.equal(capturedBody.toString(), "video-bytes");
});

test("requires a loopback same-origin caller", async () => {
  let upstreamCalls = 0;
  const fetchUpload: SignedUploadFetch = async () => {
    upstreamCalls += 1;
    return { status: 204 };
  };

  await withProxyServer(fetchUpload, async (origin) => {
    const response = await fetch(`${origin}${SIGNED_UPLOAD_PROXY_PATH}`, {
      body: Buffer.from("video-bytes"),
      headers: {
        "Content-Type": "video/mp4",
        Origin: "https://attacker.test",
        "x-goog-if-generation-match": "0",
        "x-seqret-upload-url": signedUploadUrl(),
      },
      method: "PUT",
    });

    assert.equal(response.status, 403);
  });

  assert.equal(upstreamCalls, 0);
});

test("enforces the backend media size limits before streaming", () => {
  const oversizedImageHeaders: IncomingHttpHeaders = {
    "content-length": String(20 * 1024 * 1024 + 1),
    "content-type": "image/jpeg",
    "x-goog-if-generation-match": "0",
  };

  assert.throws(
    () => validatedUploadHeaders(oversizedImageHeaders),
    (error: unknown) => (
      error instanceof UploadProxyRequestError && error.statusCode === 413
    ),
  );
});

test("validates the direct browser upload target and exact signed headers", () => {
  const target = signedUploadUrl();
  const request = validateSignedUploadRequest({
    bodyContentType: "video/mp4",
    bodySize: 11,
    uploadHeaders: {
      "Content-Type": "video/mp4",
      "x-goog-if-generation-match": "0",
    },
    uploadUrl: target,
  });

  assert.equal(request.uploadUrl, target);
  assert.deepEqual(request.uploadHeaders, {
    "Content-Type": "video/mp4",
    "x-goog-if-generation-match": "0",
  });
});

test("rejects unsafe browser destinations and backend-provided extra headers", () => {
  const validInput = {
    bodyContentType: "video/mp4",
    bodySize: 11,
    uploadHeaders: {
      "Content-Type": "video/mp4",
      "x-goog-if-generation-match": "0",
    },
  };

  for (const input of [
    { ...validInput, uploadUrl: signedUploadUrl("example.com") },
    {
      ...validInput,
      uploadHeaders: {
        ...validInput.uploadHeaders,
        Authorization: "Bearer must-not-leak",
      },
      uploadUrl: signedUploadUrl(),
    },
    {
      ...validInput,
      uploadHeaders: {
        ...validInput.uploadHeaders,
        "content-type": "video/mp4",
      },
      uploadUrl: signedUploadUrl(),
    },
  ]) {
    assert.throws(
      () => validateSignedUploadRequest(input),
      (error: unknown) => (
        error instanceof SignedUploadPolicyError && error.statusCode === 400
      ),
    );
  }
});

test("rejects browser body metadata that differs from the signed request", () => {
  const target = signedUploadUrl();
  const uploadHeaders = {
    "Content-Type": "video/mp4",
    "x-goog-if-generation-match": "0",
  };

  assert.throws(
    () => validateSignedUploadRequest({
      bodyContentType: "image/jpeg",
      bodySize: 11,
      uploadHeaders,
      uploadUrl: target,
    }),
    (error: unknown) => (
      error instanceof SignedUploadPolicyError && error.statusCode === 400
    ),
  );
  assert.throws(
    () => validateSignedUploadRequest({
      bodyContentType: "video/mp4",
      bodySize: 200 * 1024 * 1024 + 1,
      uploadHeaders,
      uploadUrl: target,
    }),
    (error: unknown) => (
      error instanceof SignedUploadPolicyError && error.statusCode === 413
    ),
  );
});

test("accepts only actual loopback socket addresses", () => {
  for (const address of ["127.0.0.1", "127.10.20.30", "::1", "::ffff:127.0.0.1"]) {
    assert.equal(isLoopbackRemoteAddress(address), true);
  }
  for (const address of [undefined, "0.0.0.0", "192.168.1.50", "::ffff:192.168.1.50"]) {
    assert.equal(isLoopbackRemoteAddress(address), false);
  }
});

test("keeps the API proxy target server-only and origin-scoped", () => {
  assert.equal(
    validateApiProxyTarget(" http://127.0.0.1:8000/ "),
    "http://127.0.0.1:8000",
  );
  assert.equal(
    validateApiProxyTarget("https://api.seqret.example:8443"),
    "https://api.seqret.example:8443",
  );

  for (const target of [
    undefined,
    "http://192.168.1.50:8000",
    "https://user:password@api.seqret.example",
    "https://api.seqret.example/path",
    "file:///private/etc/passwd",
  ]) {
    assert.throws(() => validateApiProxyTarget(target));
  }
});
