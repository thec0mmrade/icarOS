# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-02-07

### Added

- Renamed daedalOS to icarOS
- Vercel deployment instructions to README

### Changed

- Live deployment moved to Vercel (manual deploy from `out/`)

---

### 2026-07-22

### Added

- Security audit (`SECURITY_REVIEW.md`) and research docs

### Fixed

- Security findings from `SECURITY_REVIEW.md`

### Security

- Serve security headers on static-export deploys (Vercel), since
  `next.config.js` `headers()` does not run for `output: "export"`
