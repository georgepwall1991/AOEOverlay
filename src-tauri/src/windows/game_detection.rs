//! Event-driven game detection (Windows).
//!
//! Watches which application owns the foreground window. When the configured game
//! (default `RelicCardinal.exe`, the AoE4 binary) becomes the foreground window the
//! overlay is made visible; when you alt-tab to any other app it is hidden — so the
//! overlay is present in-game and gone everywhere else.
//!
//! Detection is **event-driven**: a `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)` hook
//! fires the instant focus changes, so show/hide is immediate instead of lagging up
//! to a poll interval. Because `WINEVENT_OUTOFCONTEXT` events are delivered on the
//! thread that registered the hook, that thread runs a Win32 message loop and does
//! nothing else. A separate worker thread owns the show/hide state and performs the
//! actual Tauri work, so a slow window operation can never stall the message pump
//! (and drop events). A low-frequency safety-net poll on the worker self-heals the
//! rare missed/NULL WinEvent.
//!
//! Visibility is applied with the same `SetLayeredWindowAttributes` alpha trick the
//! rest of the Windows module uses (alpha 255 = shown, 0 = hidden) plus
//! `set_ignore_cursor_events`, so a hidden overlay never blocks clicks on the app you
//! tabbed to. The game never loses focus — we never call `set_focus` here.

use crate::state::AppState;
use std::sync::{Arc, Condvar, Mutex, OnceLock};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use windows::core::PWSTR;
use windows::Win32::Foundation::{CloseHandle, COLORREF, HMODULE, HWND};
use windows::Win32::System::Threading::{
    OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::Accessibility::{SetWinEventHook, UnhookWinEvent, HWINEVENTHOOK};
use windows::Win32::UI::WindowsAndMessaging::{
    DispatchMessageW, GetForegroundWindow, GetMessageW, GetWindowThreadProcessId,
    SetLayeredWindowAttributes, SetWindowPos, TranslateMessage, EVENT_SYSTEM_FOREGROUND,
    HWND_TOPMOST, LWA_ALPHA, MSG, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, WINEVENT_OUTOFCONTEXT,
};

const GAME_FOCUS_EVENT: &str = "game-focus-changed";

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct GameFocusPayload {
    focused: bool,
    process_name: Option<String>,
    ever_seen: bool,
}

/// Resolves the foreground window's (process id, executable basename).
///
/// Returns `None` when the foreground window can't be inspected (e.g. the secure
/// desktop during a UAC prompt) — callers treat that as "no change".
fn foreground_process() -> Option<(u32, String)> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        let mut pid: u32 = 0;
        let thread_id = GetWindowThreadProcessId(hwnd, Some(&mut pid as *mut u32));
        if thread_id == 0 || pid == 0 {
            return None;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;
        if handle.is_invalid() {
            return None;
        }

        let mut buf = [0u16; 260];
        let mut len = buf.len() as u32;
        let result = QueryFullProcessImageNameW(
            handle,
            PROCESS_NAME_WIN32,
            PWSTR(buf.as_mut_ptr()),
            &mut len,
        );
        let _ = CloseHandle(handle);

        if result.is_err() || len == 0 {
            return None;
        }

        let full_path = String::from_utf16_lossy(&buf[..len as usize]);
        let basename = full_path
            .rsplit(['\\', '/'])
            .next()
            .unwrap_or(&full_path)
            .to_string();
        Some((pid, basename))
    }
}

/// Returns the process id owning the current foreground window, if it can be
/// determined. Lighter than `foreground_process` (no process handle / image-name
/// lookup) for the common "is this us?" check.
fn foreground_pid() -> Option<u32> {
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }
        let mut pid: u32 = 0;
        let thread_id = GetWindowThreadProcessId(hwnd, Some(&mut pid as *mut u32));
        if thread_id == 0 || pid == 0 {
            return None;
        }
        Some(pid)
    }
}

/// True when the current foreground window belongs to our own process.
///
/// Startup/repaint focus calls are gated on this so the overlay never tabs the
/// player out of a running game: we only (re)claim focus when we already own the
/// foreground (where `set_focus` is just a harmless refresh).
pub(crate) fn foreground_window_is_ours() -> bool {
    foreground_pid() == Some(std::process::id())
}

/// Gets the overlay window, tolerating the occasional "main" label on Windows.
fn overlay_window(app: &AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("overlay")
        .or_else(|| app.get_webview_window("main"))
}

/// Sets the whole-window alpha via the layered-window API (0 = invisible, 255 = opaque).
fn set_overlay_alpha(window: &tauri::WebviewWindow, alpha: u8) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let raw = HWND(hwnd.0 as isize as *mut std::ffi::c_void);
            let _ = SetLayeredWindowAttributes(raw, COLORREF(0), alpha, LWA_ALPHA);
        }
    }
}

/// Re-asserts the overlay as top-most **without activating it** (`SWP_NOACTIVATE`),
/// so it never steals focus from the game.
///
/// This is a cheap no-op when the window is already top-most; the point is to
/// recover if a transient z-order change (a toast/notification, or the game
/// re-asserting its own window) buried the overlay mid-match. We call this rather
/// than relying solely on `set_always_on_top(true)`, which Tauri can treat as a
/// no-op when it already considers the window top-most (the overlay is created
/// with `alwaysOnTop: true`), meaning no fresh `SetWindowPos` is issued.
fn reassert_topmost(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            let raw = HWND(hwnd.0 as isize as *mut std::ffi::c_void);
            let _ = SetWindowPos(
                raw,
                HWND_TOPMOST,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );
        }
    }
}

/// Reveals the overlay without stealing focus from the game.
fn show_overlay(window: &tauri::WebviewWindow, click_through: bool) {
    let _ = window.set_always_on_top(true);
    // Force a fresh HWND_TOPMOST in case Tauri no-ops the call above (the overlay
    // is born always-on-top, so its internal state may already read "topmost").
    reassert_topmost(window);
    set_overlay_alpha(window, 255);
    // Restore the user's click-through preference now that the overlay is live.
    let _ = window.set_ignore_cursor_events(click_through);
}

/// Hides the overlay and makes it click-through so it can't block the app you tabbed to.
fn hide_overlay(window: &tauri::WebviewWindow) {
    set_overlay_alpha(window, 0);
    let _ = window.set_ignore_cursor_events(true);
}

/// Public entry point used by the manual show/hide command (the toggle-overlay
/// hotkey and tray menu) so it shares the exact same alpha + click-through path
/// as the automatic game-focus watcher.
pub fn apply_overlay_visibility(window: &tauri::WebviewWindow, visible: bool, click_through: bool) {
    if visible {
        show_overlay(window, click_through);
    } else {
        hide_overlay(window);
    }
}

/// Reads the user's configured click-through preference (defaults to false).
fn current_click_through(app: &AppHandle) -> bool {
    app.try_state::<AppState>()
        .and_then(|s| s.config.lock().ok().map(|c| c.click_through))
        .unwrap_or(false)
}

/// Mutable bookkeeping for the watcher's show/hide decisions. Lives on the worker
/// thread only — never shared — so it needs no synchronization of its own.
#[derive(Default)]
struct WatcherState {
    /// `None` = no decision emitted yet this session.
    last_focused: Option<bool>,
    /// Whether the game has been seen in the foreground at least once this session.
    ever_seen: bool,
    /// Whether the watcher is currently responsible for the overlay being hidden.
    we_hid: bool,
}

/// Process-global wakeup channel between the WinEvent hook callback and the worker
/// thread. The `extern "system"` callback can't carry a closure environment, so it
/// reaches the condvar through this static. `bool` = "a foreground change is
/// pending"; the worker waits on the condvar (with a timeout that doubles as the
/// safety-net poll) and consumes the flag.
static FOREGROUND_SIGNAL: OnceLock<Arc<(Mutex<bool>, Condvar)>> = OnceLock::new();

/// Wakes the worker thread to re-evaluate the foreground. Cheap and lock-light so
/// it's safe to call from the WinEvent callback.
fn signal_foreground_changed() {
    if let Some(sig) = FOREGROUND_SIGNAL.get() {
        let (lock, cvar) = &**sig;
        if let Ok(mut pending) = lock.lock() {
            *pending = true;
            cvar.notify_one();
        }
    }
}

/// WinEvent callback for `EVENT_SYSTEM_FOREGROUND`, invoked on the hook thread's
/// message loop. MSDN requires this stay tiny and non-reentrant, so it does the
/// absolute minimum: wake the worker. We deliberately ignore the delivered `hwnd`
/// (which can arrive NULL or already destroyed) — the worker re-reads
/// `GetForegroundWindow()` fresh, which is always current.
unsafe extern "system" fn foreground_event_proc(
    _hook: HWINEVENTHOOK,
    _event: u32,
    _hwnd: HWND,
    _id_object: i32,
    _id_child: i32,
    _id_event_thread: u32,
    _dwms_event_time: u32,
) {
    signal_foreground_changed();
}

/// Registers the foreground WinEvent hook and pumps its message loop forever.
///
/// `SetWinEventHook` with `WINEVENT_OUTOFCONTEXT` delivers events on *this* thread,
/// which therefore **must** run a `GetMessage` loop or no callbacks ever fire. The
/// loop blocks in `GetMessage` between events, so the thread is idle (no polling)
/// until focus actually changes.
fn run_foreground_hook_thread() {
    unsafe {
        let hook = SetWinEventHook(
            EVENT_SYSTEM_FOREGROUND,
            EVENT_SYSTEM_FOREGROUND,
            HMODULE::default(),
            Some(foreground_event_proc),
            0, // idprocess: 0 = all processes
            0, // idthread: 0 = all threads
            WINEVENT_OUTOFCONTEXT,
        );
        if hook.is_invalid() {
            eprintln!(
                "[Windows] SetWinEventHook failed; game detection falls back to the safety-net poll"
            );
            return;
        }

        let mut msg = MSG::default();
        // GetMessage returns >0 for a message, 0 for WM_QUIT, -1 on error; stop on
        // anything <= 0. We never post WM_QUIT (the hook lives for the whole app),
        // so this loops until the process exits.
        while GetMessageW(&mut msg, HWND::default(), 0, 0).0 > 0 {
            let _ = TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
        let _ = UnhookWinEvent(hook);
    }
}

/// Reads the detection config: (enabled, auto_hide, process_names, safety-net ms).
///
/// Now that the WinEvent hook drives responsiveness, the poll is purely a safety
/// net for missed/NULL events, so we run it slowly (≥2s, capped at 5s) to keep idle
/// CPU near zero. A user who raised "Detection speed" above 2s is still honored.
fn read_detection_config(app: &AppHandle) -> (bool, bool, Vec<String>, u64) {
    match app.try_state::<AppState>() {
        Some(state) => match state.config.lock() {
            Ok(cfg) => {
                let gd = cfg.game_detection.clone().unwrap_or_default();
                let safety = u64::from(gd.poll_interval_ms).clamp(2000, 5000);
                (gd.enabled, gd.auto_hide, gd.process_names, safety)
            }
            Err(_) => (false, false, Vec::new(), 2000),
        },
        None => (false, false, Vec::new(), 2000),
    }
}

/// Pure show/hide decision from a single foreground observation, separated from the
/// Win32/Tauri plumbing so the (subtle) ever-seen / our-PID / last-focused rules can
/// be unit-tested. Returns `(decision, process_name)` where `decision` is `None`
/// when the state should be left unchanged. May set `ever_seen` when the game is
/// observed in the foreground.
fn decide_focus(
    foreground: &Option<(u32, String)>,
    process_names: &[String],
    our_pid: u32,
    last_focused: Option<bool>,
    ever_seen: &mut bool,
) -> (Option<bool>, Option<String>) {
    match foreground {
        Some((pid, exe)) => {
            if process_names.iter().any(|n| n.eq_ignore_ascii_case(exe)) {
                *ever_seen = true;
                (Some(true), Some(exe.clone()))
            } else if *pid == our_pid {
                // Our own settings/overlay window is focused: stay as-is.
                (last_focused, Some(exe.clone()))
            } else if *ever_seen {
                // A different real app is focused after we've seen the game.
                (Some(false), Some(exe.clone()))
            } else {
                // Never seen the game yet — keep the overlay visible so the user
                // isn't greeted by a blank screen before they launch.
                (last_focused, Some(exe.clone()))
            }
        }
        None => (last_focused, None),
    }
}

/// Core show/hide decision + application. Called by the worker thread on every
/// foreground-change signal and on each safety-net timeout. Returns the safety-net
/// wait (ms) to use for the next cycle.
fn evaluate_and_apply(app: &AppHandle, st: &mut WatcherState) -> u64 {
    let (enabled, auto_hide, process_names, safety_ms) = read_detection_config(app);

    // Feature off (or auto-hide off): make sure we never leave the overlay stuck
    // hidden, then idle until it's turned back on.
    if !enabled || !auto_hide {
        if st.we_hid {
            if let Some(win) = overlay_window(app) {
                show_overlay(&win, current_click_through(app));
            }
            st.we_hid = false;
        }
        st.last_focused = None;
        return safety_ms;
    }

    let foreground = foreground_process();

    // Whether a configured game executable is the *current* foreground this tick.
    // The top-most re-assertion below is gated on this rather than on `last_focused`:
    // when our own Settings window (which shares our PID) comes to the foreground,
    // `decide_focus` deliberately preserves `last_focused == Some(true)`, so keying
    // off it would keep promoting the overlay above Settings and intercept its clicks.
    let game_foreground = matches!(
        &foreground,
        Some((_, exe)) if process_names.iter().any(|n| n.eq_ignore_ascii_case(exe))
    );

    let (decision, process_name) = decide_focus(
        &foreground,
        &process_names,
        std::process::id(),
        st.last_focused,
        &mut st.ever_seen,
    );

    if let Some(focused) = decision {
        if st.last_focused != Some(focused) {
            st.last_focused = Some(focused);

            if let Some(win) = overlay_window(app) {
                if focused {
                    show_overlay(&win, current_click_through(app));
                    st.we_hid = false;
                } else {
                    hide_overlay(&win);
                    st.we_hid = true;
                }
            }

            if let Some(state) = app.try_state::<AppState>() {
                if let Ok(mut rt) = state.game_detection.lock() {
                    rt.focused = focused;
                    rt.ever_seen = st.ever_seen;
                }
            }

            let _ = app.emit(
                GAME_FOCUS_EVENT,
                GameFocusPayload {
                    focused,
                    process_name: process_name.clone(),
                    ever_seen: st.ever_seen,
                },
            );
        }
    }

    // While the game itself owns the foreground, keep re-asserting top-most so a
    // transient z-order change (a notification, or the game re-asserting its own
    // window) can't bury the overlay mid-match. This runs beyond the focus
    // *transition* above because the overlay can lose top-most without any focus
    // change. `SWP_NOACTIVATE` means it never pulls focus off the game, and it's a
    // no-op when already top-most. Gated on `game_foreground` (not `last_focused`)
    // so we never fight our own Settings window for the top spot.
    if game_foreground && !st.we_hid {
        if let Some(win) = overlay_window(app) {
            reassert_topmost(&win);
        }
    }

    safety_ms
}

/// Worker thread: owns `WatcherState`, applies every decision, and never blocks the
/// hook thread. Wakes instantly on a foreground-change signal, or every `safety_ms`
/// as a safety net for missed/NULL WinEvents.
fn run_watcher_worker(app: AppHandle, signal: Arc<(Mutex<bool>, Condvar)>) {
    let mut st = WatcherState::default();
    // Apply an initial decision immediately so the overlay is correct at startup,
    // before the first focus change arrives.
    let mut safety_ms = evaluate_and_apply(&app, &mut st);

    let (lock, cvar) = &*signal;
    loop {
        let pending = lock.lock().unwrap_or_else(|e| e.into_inner());
        // Block until the hook signals a change or the safety interval elapses. Any
        // signal that arrives while we're applying the previous decision leaves the
        // flag set, so the next iteration returns immediately — no event is lost.
        let (mut pending, _timeout) = cvar
            .wait_timeout_while(pending, Duration::from_millis(safety_ms), |p| !*p)
            .unwrap_or_else(|e| e.into_inner());
        *pending = false;
        drop(pending); // release before the (slower) Tauri/Win32 work

        safety_ms = evaluate_and_apply(&app, &mut st);
    }
}

/// Starts game detection: an event-driven `SetWinEventHook` (instant show/hide on
/// focus changes) plus a slow safety-net poll on a worker thread. Replaces the old
/// 700ms busy poll.
pub fn start_game_detection(app: AppHandle) {
    let signal = Arc::new((Mutex::new(false), Condvar::new()));
    // Publish for the `extern "system"` callback. `set` only fails if detection was
    // already started this process; the existing signal is fine to keep.
    let _ = FOREGROUND_SIGNAL.set(Arc::clone(&signal));

    // Hook thread: registers the WinEvent hook and pumps its message loop.
    thread::spawn(run_foreground_hook_thread);

    // Worker thread: owns the state and applies show/hide off the hook thread.
    thread::spawn(move || run_watcher_worker(app, signal));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basename_extraction_matches_game() {
        // Simulate what foreground_process() builds from a full image path.
        let full = "C:\\Program Files\\Age of Empires IV\\RelicCardinal.exe";
        let basename = full.rsplit(['\\', '/']).next().unwrap().to_string();
        assert_eq!(basename, "RelicCardinal.exe");
        assert!(basename.eq_ignore_ascii_case("reliccardinal.exe"));
    }

    #[test]
    fn test_basename_extraction_unix_separator() {
        let full = "/mnt/games/RelicCardinal.exe";
        let basename = full.rsplit(['\\', '/']).next().unwrap().to_string();
        assert_eq!(basename, "RelicCardinal.exe");
    }

    fn games() -> Vec<String> {
        vec!["RelicCardinal.exe".to_string()]
    }

    const OUR_PID: u32 = 4242;

    #[test]
    fn decide_game_foreground_shows_and_marks_seen() {
        let mut ever_seen = false;
        let fg = Some((1000, "RelicCardinal.exe".to_string()));
        let (decision, name) = decide_focus(&fg, &games(), OUR_PID, None, &mut ever_seen);
        assert_eq!(decision, Some(true));
        assert_eq!(name.as_deref(), Some("RelicCardinal.exe"));
        assert!(ever_seen, "seeing the game must set ever_seen");
    }

    #[test]
    fn decide_game_foreground_is_case_insensitive() {
        let mut ever_seen = false;
        let fg = Some((1000, "reliccardinal.EXE".to_string()));
        let (decision, _) = decide_focus(&fg, &games(), OUR_PID, None, &mut ever_seen);
        assert_eq!(decision, Some(true));
    }

    #[test]
    fn decide_other_app_after_game_seen_hides() {
        let mut ever_seen = true; // game seen earlier this session
        let fg = Some((9999, "chrome.exe".to_string()));
        let (decision, _) = decide_focus(&fg, &games(), OUR_PID, Some(true), &mut ever_seen);
        assert_eq!(
            decision,
            Some(false),
            "alt-tabbing away from the game hides it"
        );
    }

    #[test]
    fn decide_other_app_before_game_seen_preserves() {
        let mut ever_seen = false; // game never launched yet
        let fg = Some((9999, "chrome.exe".to_string()));
        let (decision, _) = decide_focus(&fg, &games(), OUR_PID, None, &mut ever_seen);
        assert_eq!(
            decision, None,
            "before the game is ever seen, leave the overlay visible (don't force-hide)"
        );
        assert!(!ever_seen);
    }

    #[test]
    fn decide_our_own_window_preserves_state() {
        // Our Settings/overlay window is focused (shares our PID): keep whatever the
        // last decision was instead of treating it as "left the game".
        let mut ever_seen = true;
        let fg = Some((OUR_PID, "aoe4-overlay.exe".to_string()));
        let (decision, _) = decide_focus(&fg, &games(), OUR_PID, Some(true), &mut ever_seen);
        assert_eq!(
            decision,
            Some(true),
            "focusing our own window must not hide the overlay"
        );
    }

    #[test]
    fn decide_no_foreground_preserves_state() {
        // e.g. the secure desktop during a UAC prompt — treat as "no change".
        let mut ever_seen = true;
        let (decision, name) = decide_focus(&None, &games(), OUR_PID, Some(false), &mut ever_seen);
        assert_eq!(decision, Some(false));
        assert!(name.is_none());
    }
}
