const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);

export function validateApiProxyTarget(configuredTarget: string | undefined): string {
  const target = configuredTarget?.trim();
  if (!target) {
    throw new Error("SEQRET_API_PROXY_TARGET is required for API mode");
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    throw new Error("SEQRET_API_PROXY_TARGET must be an absolute URL");
  }

  if (
    !["http:", "https:"].includes(parsedTarget.protocol)
    || parsedTarget.username
    || parsedTarget.password
    || parsedTarget.pathname !== "/"
    || parsedTarget.search
    || parsedTarget.hash
  ) {
    throw new Error("SEQRET_API_PROXY_TARGET must be a plain HTTP(S) origin");
  }
  if (
    parsedTarget.protocol !== "https:"
    && !LOOPBACK_HOSTNAMES.has(parsedTarget.hostname)
  ) {
    throw new Error("SEQRET_API_PROXY_TARGET must use HTTPS outside loopback");
  }

  return parsedTarget.origin;
}
