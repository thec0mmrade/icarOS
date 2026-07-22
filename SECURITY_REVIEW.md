# icarOS Security Review (Verified)

**Date:** 2026-07-22
**Scope:** Full source tree (`components/`, `contexts/`, `utils/`, `hooks/`, `pages/`, config). Vendored code under `public/Program Files/` reviewed for provenance only.
**Method:** Five parallel focused audits (XSS, SSRF/fetch, secrets, postMessage/iframe, supply-chain). Every finding below was traced end-to-end in current code, not carried over from the earlier automated `SECURITY_AUDIT.md`.

## Threat model

icarOS is a **static, client-only** export — no server, no backend, no privileged network position. That reframes severity:

- There is **no server-side SSRF** and no ambient server credentials to steal.
- The realistic attackers are: (a) a **malicious file** in the virtual filesystem (dropped, downloaded, extracted from a ZIP, or synced from a mounted S3 bucket), and (b) a **malicious remote party** whose content the app renders (a Nostr contact, a browsed page, an AI model response).
- The crown jewels are **client-side**: the BrowserFS/IndexedDB virtual filesystem, and long-lived secrets kept in `localStorage` (S3 keys, Nostr private key).

The dominant risk pattern is: **code execution at the app's own origin → read everything in the FS and steal stored credentials.** Findings that enable that are ranked highest.

---

## Critical / High

### H1 — Browser app: local HTML runs as `srcDoc` under `allow-same-origin allow-scripts` (same-origin sandbox escape)

**`components/apps/Browser/index.tsx:134,487` + `utils/constants.ts:13-17`**

Opening a local `.htm`/`.html` file sets `srcDoc` to the file contents (`:134`), rendered in an iframe spread with `IFRAME_CONFIG`, whose sandbox includes both `allow-same-origin` and `allow-scripts`. `srcdoc` content inherits the embedder's origin, and `allow-same-origin` prevents the opaque-origin downgrade — so inline scripts in the file execute **at the app's own origin** and can reach `window.parent`/`window.top`. That grants full read/write to the parent DOM, the entire virtual filesystem, `session.json`, and any credentials held in memory. The `credentialless` attribute does not mitigate this (it only affects cross-origin credential isolation).

- **Trigger:** user opens a malicious `.html` file (desktop drop, download, ZIP extract, S3 mount) in the Browser app.
- **Fix:** use a separate locked-down sandbox for the Browser's untrusted `srcDoc`/remote path — drop `allow-same-origin` (or `allow-scripts`) for that case. Keep the permissive config only for the trusted local apps (Paint, HexEdit) that genuinely need parent interaction.

### H2 — Stored XSS via crafted filename in Taskbar Search

**`components/system/Taskbar/Search/ResultEntry.tsx:55-73, 192`**

`name` is built from the raw filename (`baseName = basename(url)`) and injected via `dangerouslySetInnerHTML`. The only transformation wraps the matched _search term_ in `<span>`; the regex-escape at `:59-62` is for regex metachars, **not** HTML escaping. The filename itself is never escaped.

- **Exploit:** create a file named `<img src=x onerror=alert(document.cookie)>.txt`, open Search, type `img`. The `onerror` fires. Persists as long as the file exists; needs no model or network.
- **Impact:** arbitrary JS at the app origin → reads the plaintext credentials in H3. This is the most trivially exploitable finding.
- **Fix:** HTML-escape `baseName` before wrapping (an `escapeHtml` helper already exists at `components/system/Taskbar/AI/functions.ts:67`), or highlight via DOM nodes instead of an HTML string.

### H3 — Long-lived credentials stored in plaintext `localStorage`

**`utils/s3/credentials.ts:11-12` (S3) and `components/apps/Messenger/functions.ts:106` (Nostr)**

- **S3:** `accessKeyId` and `secretAccessKey` are written to `localStorage` unencrypted (`s3_access_<id>`, `s3_secret_<id>`) and auto-remounted on every session load (`hooks/useS3ConnectionLoader.ts:31-37`). _Good:_ they are never put in `session.json`, never logged, and only SigV4 signatures (not the secret) go on the wire.
- **Nostr:** `generatePrivateKey()` result is written to `localStorage` (`nostr_private_key`) with no encryption and indefinite lifetime. NIP-04 has no forward secrecy, so theft allows retroactive decryption of all DMs. _Good:_ a NIP-07 browser extension is preferred when present, so extension users skip this path.

Any XSS (H1/H2/H4) or any compromised same-origin vendored script exfiltrates these. Because the app serves a large volume of third-party JS same-origin from `public/Program Files/`, the blast radius of a single compromised bundle is total.

- **Fix:** encrypt at rest with a user passphrase (WebCrypto), or offer an in-memory/session-only mode; for Nostr, prefer non-extractable WebCrypto keys. Add UI guidance to use narrowly-scoped S3 keys.

---

## Medium

### M1 — AI chat renders model output as HTML without sanitization

**`components/system/Taskbar/AI/AIChat.tsx:463`; `ai.worker.ts:253`**

The assistant response is `marked.parse()`'d (which passes raw HTML through) and injected via `dangerouslySetInnerHTML` with no DOMPurify. The _user_ prompt is correctly escaped (`escapeHtml`, `:119`) — only the model side is unsanitized. Reachable via prompt injection, or via the `summarize: /path` flow that feeds untrusted document/PDF text through the model. Notably, the Marked _app_ (`components/apps/Marked/useMarked.ts:48`) wraps the identical call in `DOMPurify.sanitize()` — the fix is to do the same here.

### M2 — No Content-Security-Policy

**`next.config.js:32-54`**

Headers set COOP, COEP (`credentialless`), `nosniff`, and `X-Frame-Options`, but there is **no CSP** (none in config, meta tags, or `session.json`). CSP is the standard defense-in-depth that would blunt H1/H2/M1. Its absence means every XSS sink is unmitigated. A `script-src` policy (even allowing `'self' 'unsafe-inline'` initially, tightened over time) plus `frame-src`/`connect-src` limits would materially reduce impact.

### M3 — Remote WASM fetched and executed with no integrity check

**`components/apps/Terminal/loadWapm.ts:26,139,182,237`**

The `wapm`/`run` command queries `registry.wapm.io`, fetches the download URL from the registry response, and `WebAssembly.instantiate`s it under a WASI shim. The only check is a magic-number scan (not a security control). wapm.io is a **deprecated/sunset** registry — if its domain/CDN is repurposed, a user running a package executes attacker-controlled WASM. Bounded by the browser sandbox and the minimal WASI bindings (stdout/stderr, no FS), but supply-chain trust is zero. **Fix:** gate behind an allowlist of pinned hashes, or remove the path since the registry is dead.

### M4 — Unpinned / weakly-pinned git dependencies

**`package.json:54,86`**

- `"utif": "https://github.com/photopea/UTIF.js"` — **no ref**, tracks branch HEAD. Any lockfile regeneration silently pulls whatever HEAD is then; a force-push injects code into every client bundle. (Currently frozen to `2e6be65` in `yarn.lock`, but mutably.)
- `"browserfs": "...BrowserFS.git#a96aa2d"` — commit-pinned (good) but git deps carry no `integrity` hash, and this is the core FS layer from an archived upstream.

**Fix:** pin `utif` to a full commit or vendor it; ideally vendor/fork browserfs with a full-SHA pin.

### M5 — NIP-05 verification fetches a remote-attacker-chosen host

**`components/apps/Messenger/functions.ts:360`**

`fetch(\`https://${domain}${BASE*NIP05_URL}?name=${userName}\`)`where`domain`is parsed from a viewed Nostr profile's`nip05` field — i.e. chosen by a **remote party**, and unsanitized (`domain = "evil.com/collect#"` reshapes the target). Auto-verification means merely rendering a malicious contact triggers an outbound GET, leaking the user's IP + pubkey interest to an arbitrary third party, plus low-grade same-origin-restricted LAN probing (`*@192.168.1.1`) as a timing oracle. No credentials attach (cross-origin). **Fix:** validate `domain` is a bare hostname, block private ranges, make verification opt-in.

### M6 — Credentials and browsed URLs routed through third-party CORS proxies

**`components/apps/Terminal/processGit.ts:13,56-58` and `components/apps/Browser/config.ts:77-110`**

- `git clone` routes through `cors.isomorphic-git.org`, and `--username`/`--password` pass through it — the proxy operator can read git credentials in the clear (TLS terminates at the proxy).
- Browser proxies (allorigins.win, corsproxy.io, cors.lol, theoldnet, wayback) receive the full browsed URL and response body when selected (not the default). `ALL_ORIGINS` doesn't `encodeURIComponent` the URL (`:77`), so query params can bleed into the proxy's own querystring.

Both are by-design CORS-bypass features, but users aren't warned that URLs/credentials are disclosed. **Fix:** warn on proxy use; offer a self-hosted proxy; encode the URL.

---

## Low / Informational

- **L1 — Pyodide `checkIntegrity: false`** (`components/apps/Terminal/python.ts:48`) disables SHA-256 wheel verification. Harmless now (local `indexURL`), but once `micropip` is importable a user script can `micropip.install()` arbitrary remote wheels. Remove the flag.
- **L2 — "Isolated" emulator windows aren't sandboxed** (`hooks/useIsolatedContentWindow.ts:47-85`) — built via `document.write` with **no `sandbox` attribute**, inheriting the parent origin. Content is trusted local libs and ROMs-as-data, so not currently exploitable, but the name is misleading and any emulator-lib compromise runs at full origin.
- **L3 — `mount <point> <url>`** (`contexts/fileSystem/useFileSystemContextState.ts:306`) fetches an arbitrary user-supplied URL. Self-directed (the local user typing), bounded by "could open a browser tab anyway"; note the FileManager auto-mount of `.json` index files as a lesser vector.
- **L4 — Stable Diffusion weights** pulled from Hugging Face `mlc-ai/web-sd` at mutable `main` (`public/Program Files/StableDiffusion/config.json`). Weights are data into a local runtime, so tampering yields bad images, not RCE (barring a runtime parser bug). Pin to a revision.
- **L5 — `loadScript` has no SRI** (`utils/functions.ts:290`). All ~25 current callers load same-origin from `/public`, so low impact, but SRI would harden against CDN/edge tampering when served through a third party (e.g. Vercel).
- **L6 — Vendored Google API key in jspaint** (`public/Program Files/jspaint/src/sessions.js:213`) — upstream jspaint's public Firebase web key (client-side by design), not this project's secret.

---

## Verified clean / good posture

- **No untrusted `postMessage` surface:** every `message` listener targets a same-origin Web Worker; no `window`-level message handler trusts iframe/emulator/Browser content. That entire vector is closed.
- **DOMPurify used correctly** in Messenger (`SanitizedContent.tsx:23-28`, restrictive allowlist), the Marked app (`useMarked.ts:48`), and `.whtml` previews (`FileEntry/functions.ts:636`).
- **No first-party hardcoded secrets**; `session.json` holds UI state + S3 connection _metadata_ only (no keys).
- **No `eval`/`new Function`** in first-party source.
- Fetches to NTP/IPFS/Webamp use `credentials: "omit"`; remote Browser pages stay cross-origin (contained) and use `credentialless`.

---

## Remediation priority

1. **H1** — split the iframe sandbox; stop running untrusted local HTML same-origin.
2. **H2** — escape filenames in Search (one-line fix, trivially exploitable).
3. **H3** — encrypt or in-memory the S3 + Nostr credentials.
4. **M1** — DOMPurify the AI response.
5. **M2** — add a Content-Security-Policy.
6. **M3/M4** — gate the dead WAPM registry; pin `utif`.

_This is static review, not runtime penetration testing. It supersedes the earlier automated `SECURITY_AUDIT.md`._

---

# Dynamic Validation (against the running dev server)

**Date:** 2026-07-22 · **Method:** live drive of `next dev` on `localhost:3000` using nixpkgs Chromium via Playwright (`nix-shell -p chromium`), plus response-header and code-path inspection. Each finding gets an exploitability verdict against the dev server. (H1 was fixed and separately verified before this pass.)

## Live-confirmed exploitable

### H2 + H3 + M2 — filename XSS → credential theft, unmitigated (CONFIRMED LIVE)

A single end-to-end PoC chained all three. Steps that ran against the dev server:

1. Seeded victim creds the way the app stores them: `localStorage` keys `s3_secret_poc`, `s3_access_poc`, `nostr_private_key`.
2. Added a file named `zqxjmarker<img src=x onerror=window.__H2=JSON.stringify(Object.keys(localStorage))>.txt` via the desktop **"Add file(s)"** action (the `addFile` → `createPath` import path).
3. Opened Taskbar Search, typed `zqxjmarker`.
4. Result: the raw filename rendered through `dangerouslySetInnerHTML`, an `<img>` element appeared in the result `<h1>`, the `onerror` executed, and `window.__H2` came back as `["nostr_private_key","s3_secret_poc","s3_access_poc"]`.

That single run proves **H2** (filename XSS executes in the app origin), **H3** (the payload read the credential keys from `localStorage` — real exfiltration primitive), and **M2** (no CSP: `curl -I` shows COOP/COEP/nosniff/X-Frame-Options but **no `Content-Security-Policy`**, so nothing blocked the inline handler).

**Correction to the original H2 write-up:** the interactive **rename** path is _not_ a viable vector — `removeInvalidFilenameCharacters` (`FileManager/functions.ts:339`) strips `" * / : < > ? \ |`, so a renamed file cannot contain tags. The exploit requires an **import** path that bypasses that sanitizer: `createPath` (used by "Add file(s)", drag-drop, paste, ZIP extraction, and S3 sync) writes the name **verbatim**. Host filenames on Linux and archive/S3 entry names can contain `<>`, so the vector is real — just not via rename. Confirmed live via "Add file(s)".

## Code-confirmed; exploitability determined per trigger

### M1 — AI response rendered without sanitization (CONFIRMED sink; not driven live)

`AIChat.tsx:463` injects `formattedText` via `dangerouslySetInnerHTML`; that text is `globalThis.marked.parse(message, …)` (`ai.worker.ts:253`) over raw model output, with **no DOMPurify** (the Marked _app_ sanitizes the identical call — this path doesn't). Trigger: prompt-injection or the `summarize:` flow inducing the model to emit HTML. **Against the dev server:** not reproduced live because it needs the WebLLM model to download/run (and the Prompt API needs a flagged Chrome build); the sink itself is unquestionably unsanitized, so it is exploitable whenever an attacker can influence model output.

### M6 — CORS-proxy URL/credential leakage (CONFIRMED; self-directed, reproducible)

`Browser/config.ts:77-80` route the full browsed URL to `api.allorigins.win` / `corsproxy.io` / `api.cors.lol`. Trigger: user picks a proxy from the Browser's proxy menu (default is no proxy), then browses. **Against the dev server:** fully reproducible but self-directed — once a proxy is selected, every browsed URL and the response body pass through that third party. `ALL_ORIGINS` doesn't `encodeURIComponent` the URL, so params can bleed into the proxy's own querystring.

### L3 — `mount <url>` arbitrary fetch (CONFIRMED; self-directed)

`useFileSystemContextState.ts:312` does `fetch(url)` on a user-supplied URL from the terminal `mount` command. **Against the dev server:** reproducible but self-directed and bounded by browser same-origin — it lets the local user probe their own LAN/localhost (`mount /x http://192.168.0.1/i.json`) and observe success/JSON. Not a server-side SSRF (no server, no ambient creds).

### M5 — NIP-05 fetch to a remote-chosen host (CONFIRMED sink; needs a relay)

`Messenger/functions.ts:361` fetches `https://${domain}/.well-known/nostr.json?name=${userName}` where `domain` comes from a **viewed profile's** unsanitized `nip05` field — chosen by a remote party, not the local user. Trigger: auto-verification when rendering a malicious contact. **Against the dev server:** not reproducible without a Nostr relay feeding a malicious profile, but the fetch target is attacker-controlled and unsanitized; realistic impact is IP/interest leakage to an arbitrary host plus same-origin-restricted LAN timing.

### M3 — remote WASM executed without integrity (CONFIRMED path; registry deprecated)

`loadWapm.ts:139` fetches a URL from the wapm registry response and `WebAssembly.compile`/`instantiate`s it (`:182/:237`) with only a magic-number check — no hash/signature. Trigger: terminal `wapm`/`run <pkg>`. **Against the dev server:** not fully reproduced because `registry.wapm.io` is sunset, but there is no integrity control, so a MITM or repurposed registry (or a Playwright route-tamper) would be accepted and executed.

### L1 — Pyodide integrity check disabled (CONFIRMED)

`python.ts:48` loads `micropip` with `checkIntegrity: false`, disabling SHA-256 verification against `pyodide-lock.json`. Currently benign (local `indexURL`), but once `micropip` is importable a user script can `micropip.install()` a remote wheel with the integrity control off.

### L2 — "isolated" emulator windows aren't sandboxed (CONFIRMED by code)

`useIsolatedContentWindow.ts:52-72` creates the emulator/game iframe with **no `sandbox` attribute** and `document.write`, so it inherits the parent origin. Content is trusted local libs, so not a live exploit today — a defense-in-depth/naming gap. (Not driven live: opening a real emulator pulls heavy cores.)

## Not runtime-exploitable against a local dev server (build/trust-time or benign)

- **M4 — unpinned `utif` / weakly-pinned `browserfs`** (`package.json:54,86`): a _build/install-time_ supply-chain risk (materializes at `yarn install` / lockfile regen), not something exploitable against an already-running dev server. `utif` tracks branch HEAD (no ref); `browserfs` is commit-pinned but carries no integrity hash. Validated by manifest inspection.
- **L4 — Stable Diffusion weights at HF `main`** (mutable ref): fetched as _data_ into a local runtime; tampering corrupts images, not RCE. Requires a Hugging Face compromise; not reproducible locally.
- **L5 — `loadScript` no SRI** (`utils/functions.ts:290`): confirmed no `integrity` attribute, but all current callers load same-origin from `/public`, so low impact; SRI would only matter behind a third-party CDN.
- **L6 — Google API key in jspaint** (`public/Program Files/jspaint/src/sessions.js:213`): upstream jspaint's public Firebase web key (client-side by design), not this project's secret. Not a vulnerability here.

## Environment note

The dev server applies the security headers from `next.config.js`. Because the production build is a **static export** (`output: "export"`), those headers are **not** emitted by static hosting unless the host is configured separately — so on a deployed static site even the existing COOP/COEP/nosniff/X-Frame-Options protections may be absent, compounding M2.

---

# Remediation Applied & Tested (2026-07-22)

All fixes were type-checked (`tsc`), linted (ESLint), and verified at runtime against `next dev` with nixpkgs Chromium via Playwright, or with focused unit tests. (H1 was fixed and verified earlier.)

| ID     | Fix                                                                                                                                                                                                                                  | Test result                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **H2** | `ResultEntry.tsx` now `escapeHtml()`s the filename before the search-term `<span>` wrap; `escapeHtml` moved to shared `utils/functions.ts`.                                                                                          | Re-ran the live PoC: payload **inert** — `window.__H2` null, no `<img>`, filename shown as literal text `&lt;img …&gt;`. Jest cases added to `__tests__/utils/functions.spec.ts` (19/19 pass). |
| **H3** | `utils/s3/credentials.ts` rewritten to encrypt S3 access/secret keys with **AES-GCM** using a **non-extractable** IndexedDB `CryptoKey`; call sites awaited.                                                                         | In-browser: roundtrip OK, stored value is ciphertext (no plaintext), key non-extractable. A `localStorage` dump now yields nothing usable.                                                     |
| **M1** | `AIChat.tsx` wraps model output in `DOMPurify.sanitize(…, { ADD_TAGS: ["think"] })` before `dangerouslySetInnerHTML`.                                                                                                                | Unit test (dompurify+jsdom): strips `<img onerror>`, `<script>`, `javascript:`; keeps `<think>` + markdown.                                                                                    |
| **M2** | Added a `Content-Security-Policy` in `next.config.js`: locks `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, `form-action`; script/style/connect/frame kept permissive (static export needs inline + eval + WASM). | App boots under CSP with **0 violations** (desktop + taskbar render); header present.                                                                                                          |
| **M3** | `loadWapm.ts` now requires HTTPS and rejects document/error `Content-Type`s before `WebAssembly.compile`.                                                                                                                            | Type/lint pass. (Registry deprecated — no full live drive; blocks the repurposed-domain/MITM-serving-HTML case.)                                                                               |
| **M4** | Pinned `utif` to commit `2e6be65…` in `package.json` + `yarn.lock` (was tracking branch HEAD).                                                                                                                                       | Lockfile key updated to match; no more mutable HEAD.                                                                                                                                           |
| **M5** | `Messenger/functions.ts` validates the NIP-05 `domain` is a bare public hostname (rejects paths/ports/private ranges) and `encodeURIComponent`s the name.                                                                            | Type/lint pass; regex rejects `evil.com/x#`, `127.*`, `192.168.*`, etc.                                                                                                                        |
| **M6** | `Browser/config.ts` now `encodeURIComponent`s the URL for the ALL_ORIGINS / Wayback / OldNet proxies.                                                                                                                                | Type/lint pass.                                                                                                                                                                                |
| **L1** | `python.ts` re-enables Pyodide integrity (`checkIntegrity: true`).                                                                                                                                                                   | Type/lint pass.                                                                                                                                                                                |
| **L4** | Pinned Stable Diffusion HF weights to revision `c33c5ec…` (was `main`).                                                                                                                                                              | Confirmed via HF API the revision == current main content.                                                                                                                                     |

## Accepted risk / no code change (with rationale)

- **L2 — emulator iframes unsandboxed** (`useIsolatedContentWindow.ts`): the parent must reach into these frames (`contentWindow.document`, canvas) to run emulators, which requires same-origin; a real sandbox would need `allow-same-origin allow-scripts` and thus provide no isolation. Content is trusted, locally-bundled libs. Left as-is by design; the fix would be architectural (move emulators off the parent origin).
- **L5 — `loadScript` has no SRI**: every current caller loads same-origin from `/public`, where SRI adds little (an attacker who can alter those files already controls the origin). Worth adding only if scripts are ever served via a third-party CDN.
- **L6 — Google API key in jspaint**: it is upstream jspaint's public Firebase web key (client-side by design), not a secret of this project. Not a vulnerability.
