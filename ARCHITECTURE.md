# daedalOS Architecture Documentation

This document provides comprehensive technical documentation for daedalOS, a browser-based desktop environment built with React/Next.js.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Application Development Guide](#2-application-development-guide)
3. [Build System](#3-build-system)
4. [Potential Flaws & Improvements](#4-potential-flaws--improvements)
5. [Testing Gaps](#5-testing-gaps)
6. [Contributor Guide](#6-contributor-guide)

---

## 1. System Architecture

### 1.1 Context System

daedalOS uses a **Context Factory** pattern to create React contexts with memoized providers. This pattern is implemented in `contexts/contextFactory.tsx`:

```typescript
const contextFactory = <T,>(
  useContextState: () => T,
  ContextComponent?: React.JSX.Element
): {
  Provider: React.MemoExoticComponent<FC>;
  useContext: () => T;
}
```

**How it works:**

1. Takes a custom hook (`useContextState`) that returns the context state
2. Optionally accepts a component to render alongside children
3. Returns a memoized `Provider` and a `useContext` hook

**Usage pattern:**

```typescript
// In contexts/example/index.ts
import contextFactory from "contexts/contextFactory";
import useExampleContextState from "./useExampleContextState";

const { Provider, useContext } = contextFactory(useExampleContextState);

export { Provider as ExampleProvider, useContext as useExample };
```

### 1.2 Provider Hierarchy

The application wraps providers in a specific order (`pages/_app.tsx`):

```
ViewportProvider
  └── ProcessProvider
        └── FileSystemProvider
              └── SessionProvider
                    └── ErrorBoundary
                          └── Metadata
                                └── StyledApp
                                      └── MenuProvider
                                            └── Page Component
```

**Provider responsibilities:**

| Provider             | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `ViewportProvider`   | Viewport dimensions, fullscreen state          |
| `ProcessProvider`    | Window/process management, open/close/minimize |
| `FileSystemProvider` | BrowserFS operations, file watchers            |
| `SessionProvider`    | User preferences, window states persistence    |
| `MenuProvider`       | Context menus throughout the application       |

### 1.3 Process Management

Process management is handled by `contexts/process/`.

**Process ID (PID) Format:**

```
{AppName}__{url}__{instance}
```

Examples:

- `Terminal` - Simple process
- `FileExplorer__/Users/Public/Desktop` - Process with URL
- `FileExplorer__/Users/Public/Desktop__1` - Second instance

**Process Lifecycle:**

```
open() → linkElement() → [minimize/maximize] → closeWithTransition() → close()
           ↓
    componentWindow
    peekElement
    taskbarEntry
```

**Process State Properties (`contexts/process/types.ts`):**

```typescript
type Process = {
  // Window State
  closing?: boolean; // Triggers close animation
  maximized?: boolean; // Window is maximized
  minimized?: boolean; // Window is minimized

  // DOM References
  componentWindow?: HTMLElement; // Main window element
  peekElement?: HTMLElement; // Taskbar preview element
  taskbarEntry?: HTMLElement; // Taskbar button element

  // Configuration
  Component: React.ComponentType; // Dynamic import component
  icon: string; // Icon path
  title: string; // Window title
  defaultSize?: Size; // Initial dimensions

  // Optional Flags
  singleton?: boolean; // Only one instance allowed
  dialogProcess?: boolean; // Modal-like behavior
  hasWindow?: boolean; // Has visible window (false for Webamp)
  hideTaskbarEntry?: boolean; // Hidden from taskbar
};
```

**Key Process Functions (`contexts/process/functions.ts`):**

```typescript
// Open a new process
openProcess(processId, processArguments, icon) => (currentProcesses) => Processes

// Close with animation
closeWithTransition(id) => void  // Sets closing=true, then removes after animation

// Toggle states
maximizeProcess(id) => (currentProcesses) => Processes
minimizeProcess(id) => (currentProcesses) => Processes
```

### 1.4 File System

The file system uses **BrowserFS** with an **OverlayFS** configuration combining:

- **HTTPRequest** (readable): Static files served from `/public`
- **IndexedDB** (writable): User modifications persist locally

**FileSystemConfig (`contexts/fileSystem/FileSystemConfig.ts`):**

```typescript
const FileSystemConfig = (writeToMemory = false) => ({
  fs: "MountableFileSystem",
  options: {
    "/": {
      fs: "OverlayFS",
      options: {
        readable: {
          fs: "HTTPRequest",
          options: { index }, // Generated file index
        },
        writable: {
          fs: writeToMemory ? "InMemory" : "IndexedDB",
        },
      },
    },
  },
});
```

**Static File Index:**

Generated at build time by `scripts/fs2json.js`, output to `public/.index/fs.9p.json`:

```json
{
  "fsroot": [["name", size, mtime, children_or_null], ...],
  "size": total_bytes,
  "version": 4
}
```

**File Watchers:**

Directory change notifications use a watcher pattern:

```typescript
// Register a watcher
addFsWatcher(folder: string, updateFiles: UpdateFiles): void

// Notify watchers of changes
updateFolder(folder: string, newFile?: string, oldFile?: string): Promise<void>

// Cleanup
removeFsWatcher(folder: string, updateFiles: UpdateFiles): void
```

**Mounting:**

Supports mounting additional file systems:

| Method                                | Use Case                                        |
| ------------------------------------- | ----------------------------------------------- |
| `mountFs(url)`                        | Mount ZIP/ISO archives                          |
| `mapFs(directory, handle?)`           | Map native directory via File System Access API |
| `mountEmscriptenFs(FS)`               | Mount Emscripten app storage                    |
| `mountHttpRequestFs(mountPoint, url)` | Mount remote HTTP file index                    |

### 1.5 Session Persistence

Session data persists to `/session.json` in IndexedDB via the writable OverlayFS layer.

**Persisted Data (`contexts/session/types.ts`):**

```typescript
type SessionData = {
  // User Preferences
  aiEnabled: boolean;
  clockSource: ClockSource;
  cursor: string | undefined;
  lazySheep?: boolean;
  themeName: ThemeName;
  wallpaperFit: WallpaperFit;
  wallpaperImage: string;

  // Desktop State
  iconPositions: IconPositions;
  sortOrders: SortOrders;
  views: Views;
  windowStates: WindowStates;

  // History
  recentFiles: RecentFiles;
  runHistory: string[];
};
```

**Write Mechanism:**

Uses `requestIdleCallback` debouncing to avoid excessive writes:

```typescript
useEffect(
  () => {
    if (!loadingDebounceRef.current && sessionLoaded && !haltSession) {
      maybeRequestIdleCallback(() => {
        writeFile(SESSION_FILE, JSON.stringify({ ...sessionData }), true);
      });
    }
  },
  [
    /* all session state dependencies */
  ]
);
```

**Loading:**

On initialization, attempts to read `/session.json`, falls back to `public/session.json` defaults.

**Default Session Apps (`hooks/useSessionAppsLoader.ts`):**

The `useSessionAppsLoader` hook opens applications from the default session on page load:

```typescript
// Parses windowStates keys in format: {AppName}__{url}
// Example: "PDF__/Users/Public/Documents/About.pdf"
const [app, url] = processId.split(PROCESS_DELIMITER);

// Opens the app with the specified URL and optional args
const { args, delay: windowDelay } = windowStates[processId];
open(app, { url, ...args });
```

**WindowState Properties (`contexts/session/types.ts`):**

```typescript
type WindowState = {
  args?: Partial<ProcessArguments>;  // App-specific arguments (e.g., { page: 206 })
  delay?: number;                     // Milliseconds to wait before opening
  position?: Position;                // Initial window position { x, y }
  size?: Size;                        // Initial window size { height, width }
};
```

Configure default apps in `public/session.json`:

```json
{
  "windowStates": {
    "PDF__/Users/Public/Documents/HackersManifesto.pdf": {
      "delay": 0,
      "position": { "x": 150, "y": 110 },
      "size": { "height": 480, "width": 640 }
    },
    "PDF__/Users/Public/Documents/Book.pdf": {
      "args": { "page": 206 },
      "delay": 200,
      "position": { "x": 200, "y": 140 },
      "size": { "height": 480, "width": 640 }
    },
    "Browser__https://example.com": {
      "delay": 400,
      "position": { "x": 100, "y": 100 },
      "size": { "height": 600, "width": 900 }
    }
  }
}
```

The hook:
- Runs once on initial load (guarded by ref)
- Waits for file system and session to be ready
- Validates file existence before opening (skips missing files)
- Supports both local files and URLs (http/https)
- Supports per-window delays for staggered opening effect
- Passes optional args to applications (e.g., PDF page number)

---

## 2. Application Development Guide

### 2.1 App Registry

All applications are registered in `contexts/process/directory.ts`:

```typescript
const directory: Processes = {
  AppName: {
    // Required
    Component: dynamic(() => import("components/apps/AppName")),
    icon: "/System/Icons/appname.webp",
    title: "App Title",

    // Optional - Sizing
    defaultSize: { height: 400, width: 600 },
    lockAspectRatio: true,
    allowResizing: false,
    autoSizing: true,

    // Optional - Behavior
    singleton: true, // Only one instance
    dialogProcess: true, // Modal behavior
    hasWindow: false, // No window (e.g., Webamp)

    // Optional - Appearance
    backgroundColor: "#000",
    backgroundBlur: "8px",
    hideTitlebar: true,
    hideTaskbarEntry: true,
    hideTitlebarIcon: true,
    preferProcessIcon: true, // Use process icon in title

    // Optional - Dependencies
    libs: ["/Program Files/App/main.js"],
    dependantLibs: ["/Program Files/App/extra.wasm"],
  },
};
```

### 2.2 App Component Patterns

There are three main patterns for implementing applications:

#### Pattern 1: AppContainer + Hook (Recommended for simple apps)

Best for apps that render into a container div.

```typescript
// components/apps/Terminal/index.tsx
import AppContainer from "components/system/Apps/AppContainer";
import StyledTerminal from "./StyledTerminal";
import useTerminal from "./useTerminal";

const Terminal: FC<ComponentProcessProps> = ({ id }) => (
  <AppContainer
    StyledComponent={StyledTerminal}
    id={id}
    useHook={useTerminal}
  />
);

export default memo(Terminal);
```

**The hook receives:**

```typescript
type ContainerHookProps = {
  containerRef: React.RefObject<HTMLDivElement>;
  id: string;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  url: string;
};
```

**Examples:** Terminal, Marked, Quake3, SpaceCadet

#### Pattern 2: Custom Rendering

For apps needing full control over their rendering.

```typescript
// components/apps/FileExplorer/index.tsx
const FileExplorer: FC<ComponentProcessProps> = ({ id }) => {
  const { processes: { [id]: process } } = useProcesses();
  const { url = "" } = process || {};

  return url ? (
    <StyledFileExplorer>
      <Navigation id={id} />
      <FileManager id={id} url={url} />
    </StyledFileExplorer>
  ) : null;
};
```

**Examples:** FileExplorer, Browser, Photos

#### Pattern 3: IFrame Wrapper

For embedding external web applications.

```typescript
// components/apps/Paint/index.tsx
const Paint: FC<ComponentProcessProps> = ({ id }) => {
  const { libs: [paintSrc = ""] = [] } = process || {};
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <StyledPaint>
      <iframe
        ref={iframeRef}
        src={paintSrc}
        {...IFRAME_CONFIG}
      />
    </StyledPaint>
  );
};
```

**Examples:** Paint (jspaint)

### 2.3 Adding a New Application

**Checklist:**

1. **Create component directory:**

   ```
   components/apps/MyApp/
   ├── index.tsx           # Main component
   ├── StyledMyApp.ts      # Styled-components styles
   ├── useMyApp.ts         # Hook (if using AppContainer pattern)
   └── types.ts            # TypeScript types (optional)
   ```

2. **Register in directory:**

   ```typescript
   // contexts/process/directory.ts
   MyApp: {
     Component: dynamic(() => import("components/apps/MyApp")),
     icon: "/System/Icons/myapp.webp",
     title: "My App",
     defaultSize: { height: 400, width: 600 },
   },
   ```

3. **Add icon:**
   - Place icon at `/public/System/Icons/myapp.webp`
   - Recommended sizes: 16x16, 32x32, 48x48, 96x96

4. **Add libraries (if needed):**
   - Place in `/public/Program Files/MyApp/`
   - Reference in `libs` or `dependantLibs` array

5. **Add desktop shortcut (optional):**
   - Create `/public/Users/Public/Desktop/MyApp.url`:
   ```ini
   [InternetShortcut]
   URL=/
   IconFile=/System/Icons/myapp.webp
   ```

### 2.4 Common Hooks

| Hook                    | Purpose                         |
| ----------------------- | ------------------------------- |
| `useProcesses()`        | Access process context          |
| `useFileSystem()`       | File operations                 |
| `useSession()`          | User session/preferences        |
| `useTitle(id)`          | Manage window title             |
| `useFileDrop({ id })`   | Handle file drops               |
| `useSessionAppsLoader()`| Open apps from default session  |

---

## 3. Build System

### 3.1 Prebuild Scripts

Run via `yarn build:prebuild`:

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `fs2json.js`        | Generate file system index (`fs.9p.json`) |
| `preloadIcons.js`   | Pre-cache shortcut icons                  |
| `cacheShortcuts.js` | Parse `.url` files for quick loading      |
| `searchIndex.js`    | Build Lunr.js search index                |
| `robots.js`         | Generate robots.txt and sitemap           |
| `rssBuilder.js`     | Generate RSS feed                         |

### 3.2 File System Index Generation

`scripts/fs2json.js` generates the static file index:

```javascript
// Output format (version 4)
{
  "fsroot": [
    ["filename", size, mtime, null],           // File
    ["dirname", 0, mtime, [...children]]       // Directory
  ],
  "size": totalBytes,
  "version": 4
}
```

**Usage:**

```bash
node scripts/fs2json.js --exclude .index,private --out public/.index/fs.9p.json ./public
```

### 3.3 Post-build Optimization

Run via `yarn build:minify`:

| Script          | Purpose                           |
| --------------- | --------------------------------- |
| `minifyHtml.js` | HTML optimization                 |
| `minifyJs.js`   | JS minification + worker inlining |

**Worker Inlining (`minifyJs.js`):**

Converts Web Worker imports to inline data URLs:

```javascript
// Before
new Worker(new URL("worker.js", import.meta.url));

// After
new Worker("data:application/javascript;base64,...");
```

This uses regex matching and is a known fragile implementation.

### 3.4 Complete Build Pipeline

```bash
# Development
yarn install
yarn build:prebuild    # Required before first run
yarn dev

# Production
yarn build             # Runs prebuild + next build
yarn build:minify      # Optional post-processing
yarn serve             # Serve from /out
```

---

## 4. Potential Flaws & Improvements

### 4.1 Architectural Issues

| Issue                      | Location                           | Impact                                  | Recommendation                                                                |
| -------------------------- | ---------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| Single theme only          | `styles/themes.ts`                 | No light/dark theme switching           | Implement light theme (infrastructure exists via `prefers-color-scheme`)      |
| Monolithic utilities       | `utils/functions.ts` (1200+ lines) | Hard to maintain, navigate              | Split into domain-specific modules (`utils/icon.ts`, `utils/format.ts`, etc.) |
| Worker inlining via regex  | `scripts/minifyJs.js`              | Fragile, can break with bundler changes | Use webpack worker plugin or native import support                            |
| Minimal unit test coverage | `__tests__/`                       | Only 2 functions tested                 | Add context, hook, and component tests                                        |

### 4.2 Technical Debt

**Feature Detection Patterns:**

Multiple files define feature flags at module level:

```typescript
// Scattered across codebase
let IS_SAFARI: boolean;
let IS_FIREFOX: boolean;
// etc.
```

**Recommendation:** Consolidate into `utils/features.ts`:

```typescript
export const features = {
  isSafari: /* detection */,
  isFirefox: /* detection */,
  supportsWebP: /* detection */,
};
```

**Inconsistent Error Handling:**

Mix of patterns across codebase:

- Some use try-catch with empty catch blocks
- Some ignore errors silently
- Some reject with generic Error messages

**Recommendation:** Create error handling utilities:

```typescript
// utils/errors.ts
export const ignoreError = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};
```

**Magic Strings:**

While `utils/constants.ts` centralizes many values, some magic strings remain scattered:

- File extension checks
- Path constructions
- CSS values

### 4.3 Missing Features (from IDEAS.md)

**High Priority:**

- Progressive Web App / Offline support
- Light theme implementation
- Accessibility improvements (structure & markup)
- Screen savers (`.scr` support)

**Medium Priority:**

- Internationalization
- System tray icons
- Task Manager
- Batch file support

**Low Priority:**

- Widget support
- Windows 11 theme
- Start menu tiles

### 4.4 Performance Opportunities

| Area                | Current                             | Improvement                                  |
| ------------------- | ----------------------------------- | -------------------------------------------- |
| Icon generation     | `imageSrcs()` called repeatedly     | Memoize based on path+size                   |
| Session writes      | Debounced via `requestIdleCallback` | More aggressive debouncing for rapid changes |
| Heavy FS operations | Run on main thread                  | Move to Web Workers                          |
| Bundle size         | All apps bundled                    | More aggressive code splitting per app       |

### 4.5 Code Quality Suggestions

```typescript
// Current: Empty catch blocks
try {
  // operation
} catch {
  // Ignore failure
}

// Better: Explicit logging in development
try {
  // operation
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    console.debug("Expected error:", error);
  }
}
```

---

## 5. Testing Gaps

### 5.1 Current Coverage

**Unit Tests (`__tests__/`):**

- Only `__tests__/utils/functions.spec.ts` exists
- Tests 2 functions: `getFormattedSize`, `loadFiles`

**E2E Tests (`e2e/`):**

- Good coverage with Playwright
- Tests across Chromium, Firefox, WebKit
- Includes accessibility testing via axe-core

**E2E Test Files:**

```
e2e/
├── components/
│   ├── apps/
│   │   ├── FileExplorer.spec.ts
│   │   ├── Terminal.spec.ts
│   │   └── index.spec.ts
│   └── system/
│       ├── Apps.spec.ts
│       ├── Desktop.spec.ts
│       ├── Metadata.spec.ts
│       ├── Search.spec.ts
│       ├── StartMenu.spec.ts
│       ├── Taskbar.spec.ts
│       ├── Wallpaper.spec.ts
│       └── Window.spec.ts
├── constants.ts
├── functions.ts
└── index.spec.ts
```

### 5.2 Recommended Additions

**Context Provider Tests:**

```typescript
// Example: __tests__/contexts/process.spec.ts
describe("ProcessContext", () => {
  it("opens a new process", () => {
    const { result } = renderHook(() => useProcesses(), {
      wrapper: ProcessProvider,
    });

    act(() => result.current.open("Terminal"));

    expect(result.current.processes).toHaveProperty("Terminal");
  });

  it("closes a process with animation", async () => {
    // Test closeWithTransition behavior
  });
});
```

**File System Tests:**

```typescript
// Test OverlayFS behavior
describe("FileSystem", () => {
  it("reads static files", async () => {
    const { readFile } = await setupFileSystem();
    const content = await readFile("/System/Icons/folder.webp");
    expect(content).toBeInstanceOf(Buffer);
  });

  it("writes to IndexedDB layer", async () => {
    const { writeFile, readFile } = await setupFileSystem();
    await writeFile("/test.txt", "Hello");
    expect(await readFile("/test.txt").toString()).toBe("Hello");
  });
});
```

**Window Management Tests:**

```typescript
describe("Window", () => {
  it("maximizes on double-click titlebar", async () => {
    const { page } = await setupE2E();
    await page.dblclick('[data-testid="titlebar"]');
    expect(await page.locator(".maximized")).toBeVisible();
  });
});
```

---

## 6. Contributor Guide

### 6.1 Development Setup

```bash
# Clone and install
git clone https://github.com/DustinBrett/daedalOS.git
cd daedalOS
yarn install

# Build prerequisites
yarn build:prebuild

# Start development server
yarn dev

# If you encounter OpenSSL errors:
NODE_OPTIONS='--openssl-legacy-provider' yarn dev
```

### 6.2 Code Standards

**TypeScript:**

- Strict mode enabled
- No implicit `any` - explicit types required
- No relative imports - use absolute paths from `baseUrl`

**Styled Components:**

- Alphabetical CSS property ordering
- Run `yarn stylelint` to check

**Formatting:**

- Prettier handles formatting
- Run `yarn prettier` to format all files

**Pre-commit Hooks (via Husky):**

```json
{
  "*": "prettier --ignore-unknown --write",
  "*.{ts,tsx}": "stylelint --fix",
  "*.{js,ts,tsx}": "eslint --fix"
}
```

### 6.3 Key Files Reference

| File                                               | Purpose                                |
| -------------------------------------------------- | -------------------------------------- |
| `contexts/contextFactory.tsx`                      | Context factory pattern implementation |
| `contexts/process/directory.ts`                    | Application registry                   |
| `contexts/process/useProcessContextState.ts`       | Window/process management              |
| `contexts/fileSystem/useFileSystemContextState.ts` | File system operations                 |
| `contexts/session/useSessionContextState.ts`       | Session persistence                    |
| `hooks/useSessionAppsLoader.ts`                    | Opens apps from default session        |
| `public/session.json`                              | Default session configuration          |
| `utils/constants.ts`                               | Shared constants                       |
| `utils/functions.ts`                               | Core utility functions                 |
| `pages/_app.tsx`                                   | Provider hierarchy                     |
| `components/system/Apps/AppContainer.tsx`          | App container pattern                  |

### 6.4 Running Tests

```bash
# Unit tests
yarn test

# E2E tests
yarn e2e

# E2E with UI
yarn e2e:ui

# Linting
yarn eslint
yarn stylelint

# Find unused exports
yarn unused-exports
```

### 6.5 Common Tasks

**Adding a constant:**

```typescript
// utils/constants.ts
export const MY_CONSTANT = "value";
```

**Adding a file type association:**

1. Add extension to appropriate set in `utils/constants.ts`
2. Add handler in `contexts/process/directory.ts` or file open logic

**Modifying session persistence:**

1. Update type in `contexts/session/types.ts`
2. Add state in `useSessionContextState.ts`
3. Include in the `writeFile` call's JSON

---

## Appendix: Architecture Diagrams

### Provider Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                   ViewportProvider                   │
│  ┌───────────────────────────────────────────────┐  │
│  │                ProcessProvider                 │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │           FileSystemProvider             │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │         SessionProvider            │  │  │  │
│  │  │  │  ┌─────────────────────────────┐  │  │  │  │
│  │  │  │  │        MenuProvider          │  │  │  │  │
│  │  │  │  │  ┌───────────────────────┐  │  │  │  │  │
│  │  │  │  │  │     Page Content       │  │  │  │  │  │
│  │  │  │  │  └───────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### File System Layers

```
┌─────────────────────────────────────────┐
│              MountableFileSystem         │
│  ┌─────────────────────────────────────┐│
│  │            OverlayFS (/)             ││
│  │  ┌─────────────┬─────────────────┐  ││
│  │  │ HTTPRequest │   IndexedDB     │  ││
│  │  │ (readable)  │   (writable)    │  ││
│  │  │             │                 │  ││
│  │  │ /public/*   │ User files      │  ││
│  │  │ static      │ session.json    │  ││
│  │  └─────────────┴─────────────────┘  ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │     Dynamic Mounts (ZIP/ISO/etc)    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Process Lifecycle

```
    ┌────────────────┐
    │ open(id, args) │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │ Create Process │
    │ in processes{} │
    └───────┬────────┘
            │
            ▼
    ┌────────────────┐
    │  linkElement() │
    │ componentWindow│
    │ taskbarEntry   │
    │ peekElement    │
    └───────┬────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────┐  ┌───────────┐
│minimize │  │ maximize  │
└────┬────┘  └─────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
    ┌────────────────────┐
    │closeWithTransition │
    │ closing: true      │
    └───────┬────────────┘
            │
            ▼
    ┌────────────────────┐
    │  close() (after    │
    │  animation delay)  │
    └───────┬────────────┘
            │
            ▼
    ┌────────────────────┐
    │ Remove from        │
    │ processes{}        │
    └────────────────────┘
```

---

_Last updated: Generated from codebase analysis_
