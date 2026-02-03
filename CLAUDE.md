# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

daedalOS is a browser-based desktop environment built with React/Next.js. It emulates a full operating system experience including window management, file system, taskbar, start menu, and 20+ applications.

## Development Commands

```bash
# Development
yarn install
yarn build:prebuild          # Required before first dev run
yarn dev                     # Start dev server on localhost:3000

# Production
yarn build                   # Full production build
yarn serve                   # Serve production build

# Testing
yarn test                    # Run Jest unit tests
yarn e2e                     # Run Playwright E2E tests
yarn e2e:ui                  # E2E tests with UI

# Code Quality
yarn eslint                  # Run ESLint
yarn prettier                # Format code
yarn stylelint               # Check styled-components CSS
yarn unused-exports          # Find unused exports
```

**Note:** If you get `digital envelope routines::unsupported` during install, set `NODE_OPTIONS='--openssl-legacy-provider'`

## Architecture

### State Management Pattern

Uses a **Context Factory** pattern (`contexts/contextFactory.tsx`) to create React contexts with memoized providers:

```typescript
contextFactory<T>(useContextState: () => T, ContextComponent?) => { Provider, useContext }
```

### Provider Hierarchy

The app wraps providers in this order (`pages/_app.tsx`):
```
ViewportProvider → ProcessProvider → FileSystemProvider → SessionProvider → MenuProvider
```

Each context has its own directory under `/contexts/` containing the provider and associated hooks.

### Key Directories

- `/components/apps/` - Individual desktop applications (Browser, Terminal, Paint, etc.)
- `/components/system/` - Core OS components (Desktop, Taskbar, StartMenu, Files/FileManager)
- `/contexts/` - React Context providers (fileSystem, process, session, menu, viewport)
- `/hooks/` - Custom React hooks
- `/utils/` - Utility functions; `functions.ts` contains 50+ core helpers
- `/styles/` - Styled Components and theme configuration

### File System

Uses BrowserFS with IndexedDB storage. Static file index generated at build time via `yarn build:fs:public`.

### Window Management

Windows use `react-rnd` for resize/drag. Process context manages window state (position, size, minimized/maximized).

## Code Style Requirements

- **TypeScript strict mode** enabled
- **No relative imports** - use absolute paths from baseUrl
- **Alphabetical CSS property ordering** in styled-components
- **No implicit any** - explicit types required
- Pre-commit hooks run Prettier, ESLint, and Stylelint on staged files

## Testing

- **Unit tests:** Jest with jsdom, tests in `__tests__/` with `.spec.ts` extension
- **E2E tests:** Playwright in `e2e/` directory, includes accessibility testing with axe-core
