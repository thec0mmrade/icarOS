# RustDesk Integration

Research notes for implementing RustDesk remote desktop in icarOS.

## Overview

RustDesk is an open-source remote desktop application. It has a web client that can be embedded via iframe.

## Resources

- [RustDesk Web Client V2 Preview](https://rustdesk.com/web/)
- [RustDesk GitHub](https://github.com/rustdesk/rustdesk)
- [MonsieurBiche Fork](https://github.com/MonsieurBiche/rustdesk-web-client) - Improved build process, auto-connect via URL
- [Flutter Web Source](https://github.com/rustdesk/rustdesk/blob/master/flutter/web/index.html)

## Web Client Features

- Video decoding via WebAssembly/WebCodecs
- Clipboard support (text and images)
- File transfer
- International keyboard support
- Built with Flutter Web (compiles to JS + WASM)

## Implementation Approaches

### Option 1: Simple Iframe (Like Paint)

The user sees a window with RustDesk loaded inside. No extra UI - just the remote desktop interface.

```typescript
// components/apps/RustDesk/index.tsx
import { memo, useRef, useState } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import StyledLoading from "components/system/Apps/StyledLoading";
import { useProcesses } from "contexts/process";
import { IFRAME_CONFIG } from "utils/constants";
import StyledRustDesk from "./StyledRustDesk";

const RustDesk: FC<ComponentProcessProps> = ({ id }) => {
  const {
    processes: { [id]: { libs: [rustDeskSrc = ""] = [] } = {} },
  } = useProcesses();
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <StyledRustDesk>
      {!loaded && <StyledLoading />}
      <iframe
        ref={iframeRef}
        onLoad={() => setLoaded(true)}
        src={rustDeskSrc}
        title={id}
        {...IFRAME_CONFIG}
      />
    </StyledRustDesk>
  );
};

export default memo(RustDesk);
```

**User sees:**

```
┌─────────────────────────────────────────┐
│ [icon] RustDesk              [─][□][×] │
├─────────────────────────────────────────┤
│                                         │
│     ┌─────────────────────────┐         │
│     │  Enter Remote ID:       │         │
│     │  [_______________]      │         │
│     │                         │         │
│     │  [Connect]              │         │
│     └─────────────────────────┘         │
│                                         │
│         (RustDesk Web UI)               │
│                                         │
└─────────────────────────────────────────┘
```

### Option 2: With Connection Bar (Like Browser)

Add a toolbar for quick connection input:

```typescript
// components/apps/RustDesk/index.tsx
import { memo, useRef, useState } from "react";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useProcesses } from "contexts/process";
import { IFRAME_CONFIG } from "utils/constants";
import Button from "styles/common/Button";
import StyledRustDesk from "./StyledRustDesk";

const RUSTDESK_BASE = "https://your-rustdesk-server/web";

const RustDesk: FC<ComponentProcessProps> = ({ id }) => {
  const [remoteId, setRemoteId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const connect = () => {
    const connectUrl = `${RUSTDESK_BASE}/#/connect?id=${remoteId}`;
    iframeRef.current?.setAttribute("src", connectUrl);
  };

  return (
    <StyledRustDesk>
      <nav>
        <input
          placeholder="Remote ID"
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && connect()}
        />
        <Button onClick={connect}>Connect</Button>
      </nav>
      <iframe
        ref={iframeRef}
        onLoad={() => setLoaded(true)}
        src={RUSTDESK_BASE}
        title={id}
        {...IFRAME_CONFIG}
      />
    </StyledRustDesk>
  );
};

export default memo(RustDesk);
```

**User sees:**

```
┌─────────────────────────────────────────┐
│ [icon] RustDesk              [─][□][×] │
├─────────────────────────────────────────┤
│ Remote ID: [123456789____] [Connect]    │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         (Remote Desktop View)           │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## Registry Entry

```typescript
// contexts/process/directory.ts
RustDesk: {
  Component: dynamic(() => import("components/apps/RustDesk")),
  backgroundColor: "#2C2C2C",
  defaultSize: { height: 600, width: 800 },
  icon: "/System/Icons/rustdesk.webp",
  libs: ["https://your-rustdesk-server/web/"],  // or local path
  title: "RustDesk",
}
```

## How User Launches It

1. **Desktop shortcut** - Double-click RustDesk icon
2. **Start menu** - Click RustDesk in apps list
3. **Terminal** - Type `rustdesk` command
4. **URL parameter** - `/?app=RustDesk`

The window appears like any other icarOS app - draggable, resizable, minimizable to taskbar, with peek preview on hover.

## Server Requirements

- RustDesk relay server with ports 21115-21119 (TCP)
- WSS support on ports 21118/21119 for web client
- HTTPS required for secure WebSocket connections
- CORS configuration to allow requests from icarOS origin

## Challenges

| Challenge         | Notes                                         |
| ----------------- | --------------------------------------------- |
| Server dependency | Requires RustDesk relay server infrastructure |
| Flutter Web size  | Large initial download (~10-20MB)             |
| WebRTC/WebSocket  | May have firewall/NAT traversal issues        |
| No offline mode   | Useless without network connectivity          |

## Implementation Steps

1. Set up RustDesk server with WSS support
2. Create `components/apps/RustDesk/` directory
3. Add component files (index.tsx, StyledRustDesk.ts)
4. Register in `contexts/process/directory.ts`
5. Add icon to `/public/System/Icons/`
6. Optionally add desktop shortcut
