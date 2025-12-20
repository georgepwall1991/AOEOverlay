use std::process::{Command, Stdio};

#[tauri::command]
pub fn play_sound(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        Command::new("afplay")
            .arg(path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(target_os = "windows")]
    {
        let script = format!(
            "$player = New-Object System.Media.SoundPlayer; \
             $player.SoundLocation = '{}'; \
             $player.Play()",
            path
        );
        Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Command::new("paplay")
            .arg(path)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}
