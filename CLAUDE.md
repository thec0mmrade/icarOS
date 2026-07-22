# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **For comprehensive documentation**, see [ARCHITECTURE.md](./ARCHITECTURE.md) which covers system internals, app development patterns, build system, and improvement opportunities.

## Project Overview

icarOS is a browser-based desktop environment built with React/Next.js. It emulates a full operating system experience including window management, file system, taskbar, start menu, and 20+ applications.

The build is a **static export** (`output: "export"` in `next.config.js`) — everything runs client-side. There are no API routes or server-side rendering; do not add code that depends on a Node.js server at runtime.

## Development Commands

```bash
# Development
yarn install
yarn build:prebuild          # Required before first dev run
yarn dev                     # Start dev server on localhost:3000

# Production
yarn build                   # Full production build (static export to out/)
yarn serve                   # Serve production build from out/

# Testing
yarn test                    # Run Jest unit tests
yarn test path/to/file.spec.ts        # Run a single unit test file
yarn test -t "test name"              # Run tests matching a name
yarn e2e                     # Run Playwright E2E tests (starts its own dev server)
yarn e2e --project=chromium e2e/index.spec.ts   # Single E2E file, one browser
yarn e2e:ui                  # E2E tests with UI

# Code Quality
yarn eslint                  # Run ESLint
yarn prettier                # Format code
yarn stylelint               # Check styled-components CSS
yarn unused-exports          # Find unused exports
```

**Note:** On Node.js 17+, `yarn install` may require `NODE_OPTIONS='--openssl-legacy-provider'` due to browserfs dependency build. The main build/dev commands work without it.

## Architecture Quick Reference

### Context Factory Pattern

Uses `contexts/contextFactory.tsx` to create memoized providers:

```typescript
contextFactory<T>(useContextState: () => T, ContextComponent?) => { Provider, useContext }
```

### Provider Hierarchy (`pages/_app.tsx`)

```
ViewportProvider → ProcessProvider → FileSystemProvider → SessionProvider → MenuProvider
```

### Key Directories

| Directory             | Purpose                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `/components/apps/`   | Desktop applications (Browser, Terminal, Paint, etc.)                  |
| `/components/system/` | Core OS components (Desktop, Taskbar, StartMenu, FileManager)          |
| `/contexts/`          | React Context providers (fileSystem, process, session, menu, viewport) |
| `/utils/`             | Utility functions; `functions.ts` contains core helpers                |
| `/styles/`            | Styled Components and theme configuration                              |

### Key Files

| File                                               | Purpose                          |
| -------------------------------------------------- | -------------------------------- |
| `contexts/process/directory.ts`                    | App registry - add new apps here |
| `contexts/process/useProcessContextState.ts`       | Window/process management        |
| `contexts/fileSystem/useFileSystemContextState.ts` | File operations                  |
| `contexts/session/useSessionContextState.ts`       | Session persistence              |
| `hooks/useSessionAppsLoader.ts`                    | Opens apps from default session  |
| `public/session.json`                              | Default session configuration    |
| `utils/constants.ts`                               | Shared constants                 |

### File System

- Uses BrowserFS with OverlayFS (HTTPRequest readable + IndexedDB writable)
- Static file index generated at build time via `yarn build:fs:public`
- Session persists to `/session.json`
- S3-compatible storage can be mounted via S3 Connection dialog (Run: "s3")

### Window Management

- Windows use `react-rnd` for resize/drag
- Process context manages state (position, size, minimized/maximized)
- PID format: `{AppName}__{url}__{instance}`

## Adding New Applications

1. Create component in `/components/apps/AppName/`
2. Register in `/contexts/process/directory.ts`
3. Add icon to `/public/System/Icons/`
4. Add libs to `/public/Program Files/` if needed

See [ARCHITECTURE.md](./ARCHITECTURE.md#2-application-development-guide) for detailed patterns.

## Code Style Requirements

- **TypeScript strict mode** enabled
- **No relative imports** - use absolute paths from baseUrl (ESLint-enforced)
- **Alphabetical object keys** - `sort-keys-fix` and `typescript-sort-keys` ESLint rules require sorted keys in object literals and type/interface members
- **Alphabetical CSS property ordering** in styled-components
- **No implicit any** - explicit types required
- Pre-commit hooks (husky + lint-staged) run Prettier, ESLint `--fix`, and Stylelint `--fix` on staged files

## Testing

- **Unit tests:** Jest with jsdom, tests in `__tests__/` with `.spec.ts` extension
- **E2E tests:** Playwright in `e2e/` directory, includes accessibility testing with axe-core
