# Windows WebView2 Overlay Visibility Bug

**Status:** Fixed as of Dec 12, 2025.

## Problem Summary
The Tauri overlay window is not visible on Windows when running `tauri dev` on cold start. The tray icon appears, settings window works, but the main transparent overlay is invisible.

**Key Pattern**: Hot reload (HMR) makes the overlay appear, but cold start doesn't show it.

## Environment
- Tauri v2 with WebView2 on Windows
- Transparent window (`transparent: true`, `shadow: false` in tauri.conf.json)
- React 18 with Vite

## Findings

### 1. Content Outside vs Inside #root
**Critical Discovery**: Content rendered OUTSIDE the `#root` element shows correctly, but content INSIDE `#root` does not.

| Element Location | Visibility on Cold Start |
|-----------------|-------------------------|
| `<div>` appended to `<body>` directly | ✅ Shows |
| Static HTML inside `#root` | ❌ Hidden (or flashes briefly) |
| React-rendered content inside `#root` | ❌ Hidden |
| React-rendered in dynamic container | ❌ Still hidden |

### 2. Hot Reload Triggers Visibility
When Vite HMR updates fire (e.g., saving a file), the overlay suddenly becomes visible:
```
22:48:42 [vite] (client) hmr update /src/components/overlay/Overlay.tsx
```
After this message, the overlay appears. This suggests HMR triggers some repaint/recomposite that cold start doesn't.

### 3. Brief Flash on Load
The cyan "INSIDE ROOT" test element was seen briefly before disappearing. This indicates:
- Content IS being rendered to the DOM
- Something causes it to become invisible after initial paint
- Not a rendering issue, but a compositing/painting issue

### 4. Transparency + #root CSS
The original CSS:
```css
html, body, #root {
  background: transparent;
  overflow: hidden;
}
```

We tried changing `#root` to `background: rgba(0, 0, 0, 0.001)` (nearly invisible) but it didn't help.

### 5. Windows API Attempts
We tried using `SetLayeredWindowAttributes` to force alpha=255 on the layered window:
```rust
SetLayeredWindowAttributes(hwnd, COLORREF(0), 255, LWA_ALPHA)
```
This returns "The parameter is incorrect" - the window may not have `WS_EX_LAYERED` style, or the HWND conversion is wrong.

### 6. Things That DON'T Work
- Multiple retry attempts with delays (up to 10 seconds)
- Forcing window show/unminimize/focus from Rust
- React state changes to force re-render
- CSS animations to force repaint
- `useLayoutEffect` with transform toggles
- Dynamically injecting style elements
- Rendering React into a dynamically created container outside #root
- Adding nearly-transparent background to #root

### 7. Things That DO Work
- Elements created with `document.createElement()` and appended to `document.body`
- Vite HMR updates (any file save triggers visibility)
- The settings window (non-transparent, separate window)

### 8. Key New Clue
Even pressing **Ctrl+S without changing code** made the overlay appear. That triggers **React Fast Refresh**,
which fully unmounts/remounts the React root. So the missing piece wasn't “DOM updates” but
“WebView2 never starts compositing the web surface until a full remount happens.”

## Technical Details

### Tauri Window Config (tauri.conf.json)
```json
{
  "label": "overlay",
  "title": "AoE4 Overlay",
  "transparent": true,
  "shadow": false,
  "decorations": false,
  "alwaysOnTop": true,
  "skipTaskbar": true,
  "visible": true
}
```

### Console Output on Start
```
[Windows] Attempting SetLayeredWindowAttributes on HWND: 0x540240
[Windows] Failed to force layered alpha=255: Error { code: HRESULT(0x80070057), message: "The parameter is incorrect." }
[Windows] Window may not have WS_EX_LAYERED style - overlay might still work
[Windows] Overlay window size: 500x600
[Windows] Overlay window position: 50,50
[Windows] Overlay window visible after apply: true
```

The window reports as visible, but content doesn't show.

## Root Cause (Best Explanation)
On some Windows/WebView2 builds, **transparent host windows** occasionally fail to
start DComp composition for the WebView surface on first load. The WebView exists and paints,
but its compositor layer is never attached to the host window until an external invalidation occurs.

React Fast Refresh (triggered by HMR / Ctrl+S) causes a root unmount/remount, which forces
WebView2 to rebuild its visual tree and finally attach/composite the surface. After that,
everything renders normally.

This appears to be a WebView2 transparency/compositor bug rather than a React/Tauri logic bug.

## Fix Implemented
We kept several layers of mitigation; the *critical* one is the forced remount.

1. **One‑time React root remount on Windows** (`src/main.tsx`)
   - Render React into a container appended to `<body>` (avoids `#root` path).
   - On Windows (and not in mock‑tauri), after ~1s:
     1. `root.unmount()`
     2. `createRoot(...).render(<App />)`
   - This mimics a single Fast Refresh and reliably kicks WebView2 compositing.

2. **Overlay mount repaint nudges** (`src/App.tsx`)
   - `OverlayWithWindowFix` runs only for the `"overlay"` window.
   - Calls `show()`, then resizes by +1px and back across several short delays.
   - This is a harmless extra nudge for slow WebView2 cold starts.

3. **Native window state retries (Windows)** (`src-tauri/src/lib.rs`, `src-tauri/src/tray.rs`)
   - Re‑applies `unminimize()`, `show()`, focus, always‑on‑top, and attempts to restore layered alpha.
   - Helpful for the separate “transparent window starts fully invisible” issue.

With all three, cold starts are now reliable in dev and release builds.

## If This Ever Regresses
1. Verify the one‑time remount still runs:
   - Only on Windows.
   - Not blocked by mock mode (`VITE_MOCK_TAURI`).
2. If it fails in a future WebView2 version:
   - Increase the remount delay to 1500–2000 ms.
   - Or remount twice with a longer gap (still cheap).
3. If you want a quick manual recovery:
   - Any hot reload / full reload will re‑trigger composition.
   - Tray menu “Recreate overlay window” is a fallback.

## Files Modified During Investigation
Final files relevant to the fix:
- `src/main.tsx` - React container outside `#root` + one‑time remount on Windows
- `src/App.tsx` - `OverlayWithWindowFix` repaint nudges
- `src-tauri/src/lib.rs` - Windows native window state retries / layered alpha attempt
- `src-tauri/src/tray.rs` - Apply the same fixes when showing via tray
- `src-tauri/src/commands.rs` - Ensure recreated overlay uses `transparent(true)` and `shadow(false)`

## Related Links
- [Tauri transparent window docs](https://tauri.app/v1/guides/features/window-customization/)
- [WebView2 transparency issues](https://github.com/nicef/chromeless-webview2)
- [Similar Tauri issue](https://github.com/nicef/chromeless-webview2)

---
*Last updated: December 12, 2025*
