# Security Audit Report for icarOS

**Audit Date:** February 4, 2026
**Version:** 2.0.0
**Auditor:** Automated Security Analysis

---

## Executive Summary

This security audit evaluated the icarOS browser-based desktop environment for common web application vulnerabilities. The codebase demonstrates security-conscious development practices in several areas, particularly with HTML sanitization using DOMPurify. However, several issues warrant attention, ranging from critical iframe sandbox concerns to medium-priority improvements.

### Risk Summary

| Severity | Count | Description                         |
| -------- | ----- | ----------------------------------- |
| Critical | 2     | Require immediate attention         |
| High     | 4     | Should be addressed in next release |
| Medium   | 4     | Recommended improvements            |
| Low/Info | 4     | Good practices already in place     |

---

## Critical Vulnerabilities

### 1. Overly Permissive Iframe Sandbox Configuration

**Location:** `utils/constants.ts:13-17`

**Code:**

```typescript
export const IFRAME_CONFIG = {
  referrerPolicy: "no-referrer" as React.HTMLAttributeReferrerPolicy,
  sandbox:
    "allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts",
};
```

**Risk:** The combination of `allow-same-origin` and `allow-scripts` in iframe sandboxing is problematic. When both are present, the sandboxed document can:

- Access the parent's cookies and localStorage
- Execute scripts that may access parent window properties
- Potentially bypass sandbox restrictions

**Impact:** High - Malicious content loaded in the Browser app could access session data or manipulate the parent document.

**Recommendation:**

- Evaluate if `allow-same-origin` can be removed for untrusted content
- Consider using `credentialless` (already set as COEP header) to isolate cross-origin resources
- Document the security trade-offs for developers

---

### 2. No Cryptographic Verification for WASM Binaries

**Location:** `components/apps/Terminal/loadWapm.ts:95-150`

**Code:**

```typescript
const fetchCommandFromWAPM = async ({
  args: [command],
}: {
  args: string[];
}): Promise<Uint8Array> => {
  // ... fetches URL from registry
  wasmBinary = new Uint8Array(await (await fetch(url)).arrayBuffer());
  // No integrity check performed
  return wasmBinary.subarray(...);
};
```

**Risk:** WASM binaries are downloaded from `registry.wapm.io` and executed without:

- Subresource Integrity (SRI) hash verification
- Signature validation
- Content-Type verification

**Impact:** Critical - Supply chain attack via compromised registry or MITM could execute arbitrary code.

**Recommendation:**

- Implement SRI hashes for known-good WASM modules
- Maintain a local allowlist of trusted packages with their expected hashes
- Verify Content-Type header matches `application/wasm`

---

## High Priority Vulnerabilities

### 3. Third-Party CORS Proxy Disclosure

**Location:** `components/apps/Browser/config.ts:77`

**Code:**

```typescript
PROXIES: Record<ProxyState, ...> = {
  ALL_ORIGINS: (url) => `https://api.allorigins.win/raw?url=${url}`,
  // ...
};
```

**Location:** `components/apps/Terminal/processGit.ts:13`

**Code:**

```typescript
const corsProxy = "https://cors.isomorphic-git.org";
```

**Risk:** User URLs are sent to external third-party services, potentially exposing:

- Private repository URLs
- Internal network URLs
- Authentication tokens in URLs

**Impact:** High - Privacy violation and potential credential leakage.

**Recommendation:**

- Warn users before sending requests through external proxies
- Consider self-hosted proxy option
- Strip sensitive query parameters before proxying

---

### 4. Private Keys Stored in localStorage

**Location:** `components/apps/Messenger/functions.ts:83-107`

**Code:**

```typescript
export const getPrivateKey = (): string =>
  localStorage.getItem(PRIVATE_KEY_IDB_NAME) || "";

export const getPublicHexKey = (existingPublicKey?: string): string => {
  if (existingPublicKey) return toHexKey(existingPublicKey);
  const newPrivateKey = generatePrivateKey();
  const newPublicKey = getPublicKey(newPrivateKey);
  localStorage.setItem(PUBLIC_KEY_IDB_NAME, newPublicKey);
  localStorage.setItem(PRIVATE_KEY_IDB_NAME, newPrivateKey);
  return toHexKey(newPublicKey);
};
```

**Constants:** `components/apps/Messenger/constants.ts:20-21`

```typescript
export const PRIVATE_KEY_IDB_NAME = "nostr_private_key";
export const PUBLIC_KEY_IDB_NAME = "nostr_public_key";
```

**Risk:** Nostr private keys stored in unencrypted localStorage are vulnerable to:

- XSS attacks (any script on the page can read them)
- Browser extensions with storage access
- Physical access to the device

**Impact:** High - Complete compromise of user's Nostr identity.

**Recommendation:**

- Use browser's Nostr extension (NIP-07) when available (code already checks for this)
- Encrypt keys using Web Crypto API with user-provided password
- Consider using IndexedDB with encryption instead of localStorage

---

### 5. Potential XSS in Search Result Filename Display

**Location:** `components/system/Taskbar/Search/ResultEntry.tsx:54-73, 191-195`

**Code:**

```typescript
const name = useMemo(() => {
  let text = baseName;
  try {
    const escapedTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`
    );
    text = text.replace(
      new RegExp(`(${escapedTerm})`, "i"),
      "<span>$1</span>"
    );
  } catch {
    // Ignore failure to wrap search text
  }
  return text;
}, [baseName, searchTerm]);

// Later rendered as:
<h1
  dangerouslySetInnerHTML={{
    __html: name,
  }}
/>
```

**Risk:** While the search term is regex-escaped, the `baseName` (filename) is directly embedded in HTML without sanitization. A malicious filename like `<img src=x onerror=alert(1)>.txt` could execute JavaScript.

**Impact:** High - XSS via crafted filenames in the virtual filesystem.

**Recommendation:**

- Escape the entire filename before inserting HTML `<span>` tags
- Use DOM manipulation instead of innerHTML
- Example fix:

```typescript
const safeName = baseName
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");
text = safeName.replace(new RegExp(`(${escapedTerm})`, "i"), "<span>$1</span>");
```

---

### 6. AI Chat Response Not Sanitized

**Location:** `components/system/Taskbar/AI/AIChat.tsx:463`

**Code:**

```typescript
<div
  dangerouslySetInnerHTML={{ __html: formattedText }}
  className={clsx({...})}
/>
```

**Sanitization in functions.ts:58-65:**

```typescript
export const responseTweaks = (text: string): string => {
  let newText = text;
  newText = text.replace("</think></p>", "</p></think>");
  return newText;
};
```

**Risk:** AI model responses are rendered as HTML without DOMPurify sanitization. While user input is properly escaped via `escapeHtml()` (line 119), the AI response could potentially contain malicious HTML if:

- The AI model is manipulated via prompt injection
- The model formatting produces exploitable HTML

**Impact:** Medium-High - Depends on trust level of AI backend.

**Recommendation:**

- Apply DOMPurify.sanitize() to AI responses
- Restrict allowed HTML tags to formatting only (`<p>`, `<br>`, `<strong>`, `<em>`, `<code>`, `<pre>`)

---

## Medium Priority Issues

### 7. No Subresource Integrity (SRI) for External Scripts

**Location:** `utils/functions.ts:290-323`

**Code:**

```typescript
const loadScript = (
  src: string,
  defer?: boolean,
  force?: boolean,
  asModule?: boolean,
  contentWindow = window as Window
): Promise<Event> =>
  new Promise((resolve, reject) => {
    const script = contentWindow.document.createElement("script");
    script.async = false;
    if (defer) script.defer = true;
    if (asModule) script.type = "module";
    script.fetchPriority = "high";
    script.src = src;
    // No integrity attribute set
    contentWindow.document.head.append(script);
  });
```

**Risk:** External scripts loaded without SRI hashes could be tampered with if the CDN is compromised.

**Impact:** Medium - Supply chain attack vector for external dependencies.

**Recommendation:**

- Generate and include integrity hashes for all scripts in `/public/Program Files/`
- Modify `loadScript()` to accept and apply integrity parameter

---

### 8. HTTPRequest FS Mount URL Not Validated

**Location:** `contexts/fileSystem/useFileSystemContextState.ts:303-336`

**Code:**

```typescript
const mountHttpRequestFs = useCallback(
  async (mountPoint: string, url: string, baseUrl?: string): Promise<void> => {
    const index = (await (await fetch(url)).json()) as object;
    // No URL validation - could fetch from any origin
    if (!(typeof index === "object" && "fsroot" in index)) {
      throw new Error("Invalid HTTPRequest FS object.");
    }
    // ...
  },
  [rootFs]
);
```

**Risk:** The terminal `mount` command could be used to fetch from arbitrary URLs, potentially:

- Scanning internal networks (SSRF)
- Accessing localhost services
- Leaking presence to tracking URLs

**Impact:** Medium - SSRF via terminal mount command.

**Recommendation:**

- Implement URL allowlist for HTTPRequest mounts
- Block private IP ranges (10.x.x.x, 192.168.x.x, 127.x.x.x)
- Require HTTPS for remote mounts

---

### 9. SSRF via NIP-05 Lookup

**Location:** `components/apps/Messenger/functions.ts:360`

**Code:**

```typescript
const nostrJson = await fetch(
  `https://${domain}${BASE_NIP05_URL}?name=${userName}`
);
```

**Risk:** User-controlled domain in NIP-05 address could be used to:

- Probe internal network services
- Perform timing attacks
- Leak user presence

**Impact:** Medium - Limited by browser same-origin restrictions, but timing information leakage possible.

**Recommendation:**

- Implement domain blocklist for private/internal ranges
- Add timeout handling
- Consider proxying through a backend service

---

### 10. Filesystem Path Validation Relies on BrowserFS

**Location:** `contexts/fileSystem/useAsyncFs.ts`

**Risk:** The async filesystem wrapper relies entirely on BrowserFS for path validation. While BrowserFS provides isolation, there's no explicit path normalization or validation at the application layer.

**Impact:** Low-Medium - BrowserFS provides adequate isolation, but defense-in-depth would be prudent.

**Recommendation:**

- Add path normalization to prevent `../` traversal attempts
- Validate paths don't escape the writable overlay layer
- Log suspicious path access attempts

---

## Good Security Practices Found

### Proper DOMPurify Usage

**Locations:**

- `components/apps/Messenger/SanitizedContent.tsx:24-27` - Restrictive allowlist (`br`, `img` only)
- `components/apps/Marked/useMarked.ts:48` - Full sanitization for markdown
- `components/system/Files/FileEntry/functions.ts:636` - Preview sanitization

### Search Term Regex Escaping

**Location:** `components/system/Taskbar/Search/ResultEntry.tsx:58-61`

```typescript
const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
```

Properly prevents ReDoS attacks via search input.

### No eval() Usage

Static analysis confirmed no `eval()` calls in application TypeScript/TSX code. The QuickJS VM in the terminal is intentionally sandboxed.

### Good HTTP Security Headers

**Location:** `next.config.js:32-54`

```javascript
headers: [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];
```

### Secure Session Storage

`public/session.json` contains only UI state (window positions, preferences) - no credentials or sensitive data.

---

## Verification Checklist

### Manual Testing

- [ ] Create a file with HTML in name (e.g., `<script>alert(1)</script>.txt`), search for it
- [ ] Test terminal `mount` command with `http://127.0.0.1:8080/` URL
- [ ] Verify iframe sandbox behavior in Browser app using DevTools
- [ ] Test NIP-05 lookup with internal domain
- [ ] Attempt prompt injection in AI chat to produce malicious HTML

### Static Analysis Commands

```bash
# Find dangerouslySetInnerHTML usage
grep -r "dangerouslySetInnerHTML" components/

# Find innerHTML assignments
grep -r "\.innerHTML\s*=" components/

# Verify no eval usage
grep -r "eval(" --include="*.ts" --include="*.tsx" .

# Check for hardcoded secrets
grep -rE "(api[_-]?key|secret|password|token)\s*[:=]" --include="*.ts" --include="*.tsx" .
```

### Dependency Audit

```bash
# Run npm security audit
yarn audit

# Check for outdated packages
yarn outdated
```

---

## Remediation Priority

### Immediate (Critical)

1. **Iframe sandbox review** - Document trade-offs, consider per-origin policies
2. **WASM integrity validation** - Implement hash verification for known packages

### Next Release (High)

3. **Fix filename XSS** - Escape filenames before HTML wrapping
4. **Encrypt Nostr keys** - Use Web Crypto API for localStorage encryption
5. **Sanitize AI responses** - Apply DOMPurify to model output
6. **Proxy privacy warnings** - Inform users when URLs are sent externally

### Backlog (Medium)

7. **Add SRI to loadScript()** - Include integrity hashes for external resources
8. **URL validation for mount** - Whitelist/blocklist for HTTPRequest FS
9. **NIP-05 SSRF mitigation** - Block internal network domains
10. **Path validation utilities** - Add explicit validation at application layer

---

## Conclusion

The icarOS codebase demonstrates security awareness in critical areas, particularly HTML sanitization. The identified issues are typical for browser-based applications handling untrusted content. Prioritizing the critical and high-severity items will significantly improve the security posture of the application.

The most impactful improvements would be:

1. Adding integrity verification for WASM modules
2. Fixing the filename XSS vulnerability
3. Encrypting stored private keys

---

_This audit was conducted through static code analysis and does not include penetration testing or runtime analysis._
