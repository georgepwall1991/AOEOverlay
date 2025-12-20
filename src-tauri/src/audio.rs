use std::process::{Command, Stdio};

#[cfg(target_os = "windows")]
use crate::platform::escape_powershell;

/// Plays a sound file asynchronously.
///
/// The spawned process runs in the background (fire-and-forget).
/// On most platforms, the process will clean itself up when complete.
#[tauri::command]
pub fn play_sound(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("afplay")
            .arg(&path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(target_os = "windows")]
    {
        // Escape path to prevent PowerShell command injection
        let escaped_path = escape_powershell(&path);
        let script = format!(
            "$player = New-Object System.Media.SoundPlayer; \
             $player.SoundLocation = '{}'; \
             $player.Play()",
            escaped_path
        );
        Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Command::new("paplay")
            .arg(&path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}
