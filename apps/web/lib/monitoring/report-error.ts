interface ParsedDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

function parseDsn(raw: string): ParsedDsn | null {
  try {
    const url = new URL(raw);
    const projectId = url.pathname.replace(/^\//, "");
    if (!url.username || !projectId) return null;
    return { publicKey: url.username, host: url.host, projectId };
  } catch {
    return null;
  }
}

const dsn = process.env.SENTRY_DSN ? parseDsn(process.env.SENTRY_DSN) : null;

/**
 * Minimal error reporter — posts directly to Sentry's envelope HTTP API via `fetch` rather than
 * the `@sentry/nextjs` SDK. That SDK injects a webpack/turbopack build plugin and assumes a
 * Node.js server runtime; this app deploys via @opennextjs/cloudflare to Cloudflare Workers, and
 * whether the SDK's instrumentation actually works correctly there isn't something verifiable
 * without a real Cloudflare deploy. A plain `fetch` call has none of that risk — it's the same
 * primitive this codebase already uses everywhere (Node, Edge, and Workers all support it).
 *
 * No-ops (besides the console.error, which always runs) when SENTRY_DSN is unset — same
 * "optional, off by default" pattern as RESEND_API_KEY and the OAuth provider credentials.
 */
export async function reportError(error: unknown, context?: Record<string, unknown>): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[error]", message, context ?? {});

  if (!dsn) return;

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const envelopeUrl = `https://${dsn.host}/api/${dsn.projectId}/envelope/?sentry_key=${dsn.publicKey}&sentry_version=7`;

  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "error",
    message: { formatted: message },
    extra: { stack, ...context },
  };

  const body = [
    JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  try {
    await fetch(envelopeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body,
    });
  } catch {
    // Reporting failure shouldn't cascade into the request that triggered it — already
    // logged locally above.
  }
}
