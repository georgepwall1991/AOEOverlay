# Overlay Improvements — Research & Plan (2026-06-03)

Research pass comparing AoE4 Overlay against [CraftySalamander/RTS_Overlay](https://github.com/CraftySalamander/RTS_Overlay)
and best-in-class overlay technique, with a prioritized "next tier" plan. Written
right after the **v1.6.0** release (game-aware auto show/hide, positioning safety).

## Headline

The features the brief asked for — *always-on-top, non-blocking, same position,
clever about when you're playing* — **already shipped in v1.6.0** and are solid:

- Always-on-top + transparent + non-blocking: `src-tauri/tauri.conf.json` (`alwaysOnTop`,
  `transparent`, `shadow:false`, `skipTaskbar`) + native alpha/click-through path in
  `src-tauri/src/windows/game_detection.rs`.
- Game-aware show/hide: foreground-window watcher (`GetForegroundWindow` +
  `QueryFullProcessImageNameW`) matching `RelicCardinal.exe`, never steals focus,
  first-seen latch. Configurable process list + poll interval (`GameDetectionConfig`).
- Position safety: `src/lib/windowBounds.ts` (`keepOnScreen`, `clampOntoMonitor`,
  `isRectVisible`) — off-screen clamp + edge-anchor on resize.

**Versus RTS_Overlay we are already ahead.** RTS_Overlay explicitly does *no* game
interaction — "no screen analysis, no controller interaction" — and has **no
auto show/hide**; the user manually drives every step. We also have TTS coaching,
matchup sheets, upgrade badges, branching, timer drift, player stats, and a native
~4 MB Tauri footprint vs their Python/Nuitka EXE.

Key platform fact that de-risks everything: **AoE4 has no true exclusive
fullscreen** — its "Fullscreen" is borderless windowed — so an always-on-top
overlay reliably draws over the game. (Forum/Steam confirmation in sources below.)

## Where RTS_Overlay still has an edge (worth borrowing)

1. **Multi-game** — AoE2 DE, AoM Retold, SC2, WC3. We're AoE4-only, but our
   `process_names` detection list + build schema could generalize.
2. **Corner-anchored positioning** — they persist position relative to the chosen
   upper-left/upper-right corner, so the anchored corner stays put as the panel
   resizes. We anchor top-left and only nudge inward on overflow (`keepOnScreen`),
   which can leave a gap on the right when the panel *shrinks*.
3. **Big community build library** via rts-overlay.github.io "Open in RTS Overlay".
   We import per-URL from aoe4world/aoe4guides/rtsbuilds — comparable but less of a
   browse-and-go library.

## Prioritized plan ("cooking on gas")

### Tier 1 — high value, low/medium effort ✅ SHIPPED (2026-06-03)

All three Tier 1 items are implemented, tested, and green (`cargo clippy`,
`cargo test` 154 ✓, `vitest` 930 ✓, `tsc`, `eslint`). The content-protection
toggle was verified live in the browser preview.

1. **Content-protect the overlay (`WDA_EXCLUDEFROMCAPTURE`).** ✅ Done.
   - Native helper `windows::set_content_protection` (`SetWindowDisplayAffinity`
     with `WDA_EXCLUDEFROMCAPTURE`/`WDA_NONE`) in `src-tauri/src/windows/setup.rs`.
   - Config field `content_protection` (default off) + Tauri command
     `set_content_protection` (persists, broadcasts, applies to the live window),
     re-applied on startup (`lib.rs`) and after `recreate_overlay_window`.
   - Frontend: `setContentProtection` wrapper, a "Hide from screen capture" toggle
     in Gameplay settings, and OCR-assist auto-enables it so OCR never reads the
     overlay's own pixels.
   - *Why native over Tauri's `set_content_protected`:* the built-in uses
     `WDA_MONITOR` on Windows (overlay renders **black** in captures); we need true
     exclude-from-capture so OCR sees the game behind it.
2. **True corner-anchored positioning.** ✅ Done.
   - `windowBounds.ts` gained `OverlayCorner`, `inferCorner` (picks the held corner
     from which monitor-quadrant the window sits in), and `anchorResize` (holds that
     corner fixed both directions, then clamps on-screen). 12 new unit tests.
   - Wired into `useAutoResize`: capture the pre-resize rect, then hold the inferred
     corner — closes the right-edge shrink-gap. Inference is used instead of the
     dormant `overlay_position` config (which is never applied/user-settable, so it
     would force top-right anchoring on everyone regardless of actual placement).
3. **Clippy cleanups.** ✅ Done — all 9 lints fixed by hand (doc comment in
   `platform.rs`, `Shortcut` copy in `hotkeys.rs`, `rsplit` char arrays in
   `game_detection.rs`, `const { assert! }` in `commands/build_order.rs`, `is_empty`
   in `state.rs`, neg-multiply in `tts.rs`). `cargo clippy --all-targets` is clean.

### Tier 2 — the "clever" frontier (medium/high effort)

4. **Live-match auto-detect via AoE4World.** We already call the AoE4World API
   (`src/lib/aoe4world.ts`). Poll the player's current/last game to auto-detect
   **civ + map + opponent**, then auto-select the matching build and matchup sheet
   the moment a game starts. This upgrades "is the game focused?" → "what am I
   playing right now?" — something no overlay does well.
5. **Wire OCR-assist → auto-advance.** The data model, settings UI, and store exist
   but it's scaffolding only (`ocrAssistStore.ts`: *"experimental and read-only…
   will not auto-advance"*). Implement the Rust capture→OCR→signal pipeline (age /
   resources / pop) behind a confidence threshold, then optionally auto-advance the
   build step on age-up. Pair with content-protection (#1) so it never reads itself.

### Tier 3 — UX polish & reach

6. **Click-through UX.** Today click-through is a manual hotkey toggle. Add an
   "interact on hover / hold modifier" mode so the overlay is click-through by
   default and only grabs the mouse when you intend it to.
7. **Multi-game groundwork.** Generalize detection + build schema to add AoE2 DE
   (`AoE2DE_s.exe`) etc., borrowing RTS_Overlay's coverage.

## Tooling status (2026-06-03)

Everything is installed but the agent shell inherits a **stale PATH even in a
fresh session** — restarting does *not* fix it (the earlier note was wrong).
Reliable fix: call the binaries by full path, or prepend them per-invocation,
e.g. `$env:PATH = "C:\Users\georg\.cargo\bin;$env:PATH"; cargo …`. See memory
`toolchain-path-inheritance`.

| Tool | Status | Location |
|------|--------|----------|
| Node / npm | ✅ on PATH | v26.3.0 / 11.16.0 |
| Rust (rustc/cargo/clippy/rustfmt/rust-analyzer) | ✅ installed, **PATH stale** | `C:\Users\georg\.cargo\bin` (User PATH) |
| Tauri CLI | ✅ via npx | 2.9.5 |
| GitHub CLI | ✅ installed, **PATH stale** | `C:\Program Files\GitHub CLI\` (Machine PATH) |
| rust-analyzer (editor LSP) | ✅ | `.vscode/extensions.json` already recommends it |
| Claude preview MCP | ✅ used | frontend verified via accessibility snapshot |

Verified this session (via full paths): `cargo check` ✅ exit 0; `cargo clippy` ✅
exit 0 (cosmetic lints only); frontend renders correctly.

## Sources

- AoE4 has no exclusive fullscreen (borderless): https://forums.ageofempires.com/t/psa-make-sure-your-game-window-is-on-borderless-fullscreen/181532 ,
  https://steamcommunity.com/app/1466860/discussions/0/3158705742074721106/
- RTS_Overlay: https://github.com/CraftySalamander/RTS_Overlay
