// @ts-check

// Single source of truth for security response headers, shared by next.config.js
// (used by the dev server) and scripts/vercelHeaders.js (which emits vercel.json
// so a static-export production deploy on Vercel actually serves them — the
// next.config headers() hook does NOT run for `output: "export"`).

// Content-Security-Policy. This app is a static export that runs emulators and
// language runtimes (QuickJS, Pyodide, v86, BoxedWine) needing eval/WASM, embeds
// Next's inline bootstrap, and injects styled-components inline styles — so
// script/style/connect/frame sources must stay permissive or the app won't boot.
// The value here comes from locking down the directives that CAN be restricted
// without breaking functionality (no plugins, no base-tag hijack, no framing by
// third parties); XSS is defended primarily by output escaping (see ResultEntry
// and AIChat), with this CSP as defense-in-depth.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: data:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: data: https:",
  "connect-src 'self' https: wss: data: blob:",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https:",
  "frame-src 'self' https: blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self' https:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

module.exports = { contentSecurityPolicy, securityHeaders };
