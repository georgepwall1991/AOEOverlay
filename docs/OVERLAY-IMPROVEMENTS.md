# Overlay Improvements — Always-on-Top, Non-Blocking, Game-Aware

Research- and code-grounded plan for making AoE4 Overlay the best-in-class
always-on-top, non-blocking, game-aware RTS overlay. Compiled from an audit of
our current Rust/React code (v1.7.0) and a teardown of the main competitor,
[CraftySalamander/RTS_Overlay](https://github.com/CraftySalamander/RTS_Overlay)
(+ FluffyMaguro/AoE4_Overlay).

## Where we already win (keep leaning in)

These are real differentiators — RTS_Overlay (the most popular competitor) has
**none** of them:

- **Game-aware auto show/hide** — foreground-process watcher
  (`src-tauri/src/windows/game_detection.rs`) shows the overlay only while AoE4
  is the active window and hides it (alpha 0 + click-through) the instant you
  alt-tab. RTS_Overlay is fully manual; its web build needs PowerToys for
  always-on-top. FluffyMaguro auto-shows but only via match data.
- **Content protection** — `SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)`
  (`src-tauri/src/windows/setup.rs`) hides the overlay from stream/share capture
  and from our own OCR screenshots. RTS_Overlay recommends the *opposite*.
- **Native always-on-top + click-through in one app** — no external utility.
- **Corner-anchored auto-resize** (v1.7.0) — matches RTS_Overlay's
  `upper_right_position − width` trick so growing content never drifts.
- **Coaching depth** — TTS, reminders, metronome, timer drift, upgrade badges,
  matchup intel, player stats. Neither competitor combines BO display + coaching
  + match data + game-awareness.

> **Licensing:** RTS_Overlay is **GPL-3.0**. Reimplement *ideas, the JSON BO
> schema, and the `@icon@` convention* freely; do **not** copy its source or
> bundled icons. (We already import the RTS Builds format in Settings → Builds.)

---

## Tier A — Core goal: rock-solid always-on-top / non-blocking / game-aware

### A1. Event-driven foreground detection (replace the 700 ms poll) ✅ DONE
**Was:** `start_game_detection` polled `GetForegroundWindow` every 700 ms
(`game_detection.rs`) — up to 700 ms of lag tabbing in/out, plus constant
background wakeups.
**Done:** `SetWinEventHook(EVENT_SYSTEM_FOREGROUND, WINEVENT_OUTOFCONTEXT)` now runs
on a **dedicated message-loop thread** (`run_foreground_hook_thread`); the OS calls
us the instant focus changes. Per MSDN ("keep the WinEvent callback tiny /
non-reentrant"), the callback only signals a **worker thread** through a `Condvar`,
and the worker (`run_watcher_worker`) owns all show/hide state and does the Tauri
work — so a slow window op can never stall the message pump and drop events. A
**2–5 s safety-net poll** (the worker's `Condvar` wait timeout) self-heals the rare
missed/NULL event, and the worker re-reads `GetForegroundWindow()` fresh, so a
NULL-delivered `hwnd` is a non-issue. Net: instant show/hide + lower idle CPU. The
subtle decision rules were extracted into a pure `decide_focus()` and unit-tested.
**Still recommended:** live in-game check (borderless + multi-monitor) — events vs.
the old poll should be imperceptibly faster with no z-order flicker.

### A2. Never steal focus from the game ✅ DONE
**Was:** `setup.rs::apply_overlay_window_state` called `window.set_focus()`, and
the cold-start retry loop called `set_focus()` up to 7× over 10 s. `App.tsx`'s
`OverlayWithWindowFix` also called `setFocus()` at 200 ms and 2 s. If the overlay
(re)initialized while AoE4 was already focused, these yanked the player out.
**Done:** Added `game_detection::foreground_window_is_ours()` (lightweight
foreground-PID vs our-PID check). Every startup/repaint `set_focus()` is now
gated on it — both native calls in `setup.rs` and the `App.tsx` repaint loop
(via `window.isFocused()`). We only (re)focus when we already own the foreground,
so launching/repainting mid-match never tabs the player out. The show + alpha +
resize-repaint paths still run unconditionally, so WebView2 still paints.
**Still recommended:** a live in-game sanity check (cold-launch with AoE4 already
running → overlay should appear without pulling you to desktop).

### A3a. Auto re-assert topmost in-game ✅ DONE
**Was:** `set_always_on_top(true)` was set on show/setup but never re-asserted;
Tauri may even no-op it (the overlay is born `alwaysOnTop`). RTS_Overlay's #1
launch complaint is "topmost doesn't stick — click Next to fix."
**Done:** Added `reassert_topmost()` —
`SetWindowPos(HWND_TOPMOST, SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE)` — called on
show *and* every watcher tick while the game owns the foreground, so a transient
z-order change (notification, the game re-asserting its window) can't bury the
overlay mid-match. `SWP_NOACTIVATE` means it never pulls focus off the game, and
it's a no-op when already top-most.
**Still recommended:** live in-game check for any z-order flicker (none expected).

### A3b. Exclusive-fullscreen guard — DEFERRED (intentional)
Detecting D3D exclusive fullscreen is easy (`SHQueryUserNotificationState` →
`QUNS_RUNNING_D3D_FULL_SCREEN`), but the *response* isn't: under exclusive
fullscreen the overlay is fully covered, so any in-overlay "switch to Borderless"
hint is invisible to the user — it would need an out-of-overlay channel (tray
balloon / native toast), which is disproportionate for an edge case (AoE4
defaults to **Borderless**, where everything works). Revisit as a small
standalone feature with a tray notification if users report it.

### A4. Clamp-to-visible-monitor + re-anchor on resolution change
**Now:** Saved position is absolute physical x/y (`commands/window.rs`); no
validation. RTS_Overlay's other top bug: unplug a monitor / change resolution →
overlay stranded off-screen.
**Change:** On startup and on display-change events, verify the saved rect
intersects a current monitor's work area; if not, re-anchor to the chosen
`overlay_position` corner of the primary monitor. Re-apply corner anchoring on
resolution change so a top-right overlay stays in the corner across 1080p↔1440p↔4K.
**Effort:** M · **Risk:** L–M · Partially testable without the game.

---

## Tier B — High-value UX

### B1. Multi-game / custom executable detection ✅ DONE (this session)
Settings → Gameplay now exposes **Detected games** (comma-separated process
names, default `RelicCardinal.exe`) and **Detection speed** (poll ms, clamped
200–5000 to match Rust). Empty list falls back to the default so detection can't
be locked out. The Rust watcher already re-reads config each tick, so edits apply
live. Foundation for officially supporting AoE2DE (`AoE2DE_s.exe`), AoM, etc.

### B2. Two-mode input model (play vs. edit)
**Idea (from RTS_Overlay):** Default to fully click-through "play" mode; a hotkey
(or hovering a small grip) flips to interactive "edit" mode (`set_ignore_cursor_events(false)`)
for dragging/resizing/button use, then back. Cleaner than today's all-or-nothing
click-through toggle, which makes *every* control unclickable. We already have
`useClickThroughUndo` — extend it into an explicit momentary "interact" affordance.
**Effort:** M · **Risk:** L.

### B3. OCR auto-timer — the "truly knows you're playing" feature
**Now:** OCR Assist is scaffolded in the frontend (`ocrAssistStore.ts`, config)
but **has no Rust capture/OCR backend** (no capture command in `lib.rs`'s
`invoke_handler`); it's experimental/read-only.
**Idea:** Add a Rust screen-capture backend (BitBlt of the game's clock region,
content-protection already prevents self-capture) + OCR (e.g. bundled Tesseract
or Windows.Media.Ocr) to read the in-game clock and **auto-start/sync the build
timer to real game time** — eliminating manual timer start and making drift
correction exact. Keep it strictly read-only (no input injection → no anti-cheat
risk, matching RTS_Overlay's stance).
**Effort:** L · **Risk:** M (accuracy, perf) · The biggest differentiator left.

---

## Tier C — Content & polish

- **C1. Auto-computed BO timings** — port the *idea* behind RTS_Overlay's
  `evaluateBOTimingAoE4()`: derive per-step timestamps from villager-creation +
  tech-research durations so count-only builds still get a working timer.
- **C2. Official multi-game profiles** — civ/icon/build sets per title, building
  on B1.
- **C3. Per-monitor position memory** — remember corner offsets per
  display/resolution (beyond A4's clamp).

---

## Suggested order
1. ~~**A2** (no focus-steal) + **A3a** (auto topmost)~~ — ✅ shipped. Live in-match
   sanity check still recommended.
2. ~~**A1** (event-driven detection)~~ — ✅ shipped. The snappiness upgrade; live
   in-match sanity check still recommended.
3. **A4** (monitor clamp/re-anchor) — kills the off-screen failure mode. *Next.* A
   `windowBounds` helper already exists on the frontend to build on; re-anchor on
   `WM_DISPLAYCHANGE` using `MonitorFromRect(MONITOR_DEFAULTTONEAREST)` +
   `GetMonitorInfo.rcWork`.
4. **B2** (two-mode input), then **B3** (OCR auto-timer) as a larger initiative.

**Verification note:** A1–A3 alter native Windows window behavior and should be
validated in an actual AoE4 session (borderless *and* exclusive fullscreen,
single + multi-monitor). Compile/clippy/test pass is necessary but not sufficient.
