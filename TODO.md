# TODO

Development tasks, from near-term to exploratory feature plans.

## In Progress

## Next Up

- [ ] Re-enable the `Tests` workflow's `push` trigger (`.github/workflows/main.yml`)
      once the full 3-browser E2E suite reliably finishes within the
      60-minute job budget — disabled 2026-08-14 (`8b5e0d58`) because even
      after quarantining the WebKit Terminal failures it still hadn't
      finished at 35+ minutes. Until then, run it manually via
      `workflow_dispatch`.
- [ ] Root-cause why Terminal's file-system-access E2E tests never render
      their prompt on WebKit (`e2e/components/apps/Terminal.spec.ts`,
      quarantined via `TERMINAL_FILE_SYSTEM_ACCESS_NOT_SUPPORTED_BROWSERS` in
      `e2e/constants.ts`) — window opens fine, but `useTerminal.ts`'s
      `loadFiles(libs)` → `window.Terminal` chain never completes in time;
      needs a real WebKit runtime to debug (this sandbox's NixOS host is
      missing the shared libs Playwright's WebKit build needs). Use the
      `Tests` workflow's `workflow_dispatch` trigger (`project: webkit`,
      default spec) to reproduce with `retries: 0` and pull the
      `playwright-report` artifact for a trace.

## Backlog

### WebTop Variant

- [ ] SSH Client
- [ ] Progressive Web App
  - [ ] Offline support ([next-offline](https://github.com/hanford/next-offline))
  - [ ] Service Worker firewall ([Mock Service Worker](https://github.com/mswjs/msw))

### Medium Priority

- [ ] System Tray Icons
- [ ] Email App (open SMTP server + [openpgpjs](https://github.com/openpgpjs/openpgpjs))
- [ ] Task Manager ([stats.js](https://github.com/mrdoob/stats.js))
- [ ] Batch File Support

### Programming Languages

- [ ] JVM support ([CheerpJ](https://labs.leaningtech.com/blog/cheerpj-3.0))
- [ ] Go support ([GopherJS](https://github.com/gopherjs/gopherjs))

### Window Management

- [ ] Wayland ([Greenfield](https://github.com/udevbe/greenfield))

### Calendar

- [ ] Calendar app ([react-big-calendar](https://github.com/jquense/react-big-calendar))
- [ ] iCAL support ([ical.js](https://github.com/kewisch/ical.js))

### File Systems

- [ ] [native-file-system-adapter](https://github.com/jimmywarting/native-file-system-adapter)
- [ ] [WebDAV](https://github.com/perry-mitchell/webdav-client)
- [ ] [harextract](https://github.com/JC3/harextract)

### File Information

- [ ] EXIF support ([Exif.js](https://github.com/exif-js/exif-js) or [EXIFR](https://github.com/MikeKovarik/exifr))

### Terminal Enhancements

- [ ] SSH ([SSHy](https://github.com/stuicey/SSHy) or [ssheasy](https://github.com/hullarb/ssheasy))

## Done

- [x] Fix security findings from SECURITY_REVIEW.md (`1dd67da6`)
- [x] Serve security headers on static-export deploys (Vercel) (`31fc0213`)
- [x] Redeploy to Vercel to make security header fixes live (deployed
      2026-08-14, `dpl_CS6ppA8orc4g62VFY3qfD5xCvEDN`, commit `fa5dccbf`)
