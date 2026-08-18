import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isDev = process.env.NODE_ENV === "development";

// Static (non-nonce) CSP, deliberately (blueprint §10). Next's own nonce-based CSP guide
// requires *every* page to render dynamically per-request — that would disable the static
// generation and ISR that the whole cost model in blueprint §0/§1/§9 depends on (thousands of
// statically served /der/[noun], /die/[noun], /das/[noun] SEO pages at ~zero compute).
// 'unsafe-inline' on script/style is the documented fallback for exactly this case (Next's
// hydration payload and our JSON-LD <script> tags both need inline execution with no nonce
// available on a static page).
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Codex → Dictionary rename: /dictionary is now canonical. permanent:true emits a 308 (Next's
  // permanent-redirect status — preserves the request method, unlike a classic 301/302), which
  // search engines treat the same as a 301 for consolidating indexed URLs and link equity. Query
  // strings pass through automatically, so /codex?level=A1 → /dictionary?level=A1 too.
  //
  // /word/:slug → /:article/:noun: pre-launch URL cleanup (no production ranking equity to
  // protect — repo has no deployed domain, no remote, no analytics/Search Console wiring at the
  // time of this change). Every word slug is built as `${article}-${noun}` (packages/word-data's
  // merge step), so the regex capture below just splits that back into the two path segments.
  async redirects() {
    return [
      { source: "/codex", destination: "/dictionary", permanent: true },
      { source: "/word/:article(der|die|das)-:noun", destination: "/:article/:noun", permanent: true },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
