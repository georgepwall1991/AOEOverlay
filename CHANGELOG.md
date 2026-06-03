# Changelog

All notable changes to the AoE4 Overlay are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-06-03

### Added

- **Game-aware auto show/hide.** The overlay now detects when Age of Empires IV
  (`RelicCardinal.exe`) is the foreground window and shows itself only while
  you're in the game — hiding the instant you alt-tab to Discord, a browser, or
  anything else. It never steals focus from the game, and a first-seen latch
  keeps the overlay visible until AoE4 is detected once, so you're never greeted
  by a blank screen. Toggle it in **Settings → Gameplay → Auto-hide when not in
  game** (on by default). A small green "Live" pill in the overlay header shows
  when detection is active.
- **Off-screen safety clamp.** If a saved window position lands on a monitor that
  has since been disconnected or rearranged, the overlay is automatically pulled
  back onto a visible screen at startup instead of being stranded off-screen.
- **Edge anchoring on resize.** As build-order steps change and the overlay
  resizes, it now stays fully on-screen by anchoring to the nearest edge instead
  of creeping past the right or bottom of the monitor.

### Fixed

- **Toggle-overlay hotkey (`Ctrl+Alt+F1`) now works.** Previously it flipped an
  internal state nothing acted on. It now genuinely shows/hides the overlay
  (and the tray show/hide actions do too), using the same reliable native
  alpha + click-through path as the game-detection feature.

### Technical

- New Windows foreground-window watcher (`src-tauri/src/windows/game_detection.rs`)
  using `GetForegroundWindow` + `QueryFullProcessImageNameW`, with a configurable
  process list and poll interval (`GameDetectionConfig`).
- New `set_overlay_visible` / `get_game_detection_state` Tauri commands and a
  `game-focus-changed` event.
- New pure, fully unit-tested geometry helpers (`src/lib/windowBounds.ts`).
- 154 Rust tests and 918 frontend tests passing.

## [1.5.0] - 2026

### Added

- Enhanced build orders, expanded hotkey support, and build-order icon rendering.
- RTS Builds import support, plus AoE4World and AoE4 Guides imports.

[1.6.0]: https://github.com/georgepwall1991/AOEOverlay/releases/tag/v1.6.0
[1.5.0]: https://github.com/georgepwall1991/AOEOverlay/releases/tag/v1.5.0
