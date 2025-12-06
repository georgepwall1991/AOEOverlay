use std::process::{Child, Command, Stdio};
use tauri::State;
use crate::state::AppState;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn kill_active_tts(state: &State<AppState>) -> Result<(), String> {
    let mut tts_process = state.tts_process.lock()
        .map_err(|_| "TTS state mutex poisoned".to_string())?;

    if let Some(mut child) = tts_process.take() {
        let _ = child.kill();
        let _ = child.wait(); // Clean up zombie
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn spawn_tts_process(text: &str, rate: f32) -> std::io::Result<Child> {
    let wpm = (rate * 200.0) as i32;
    Command::new("say")
        .args(["-r", &wpm.to_string(), text])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
}

#[cfg(target_os = "windows")]
fn escape_powershell(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '\'' => "''".to_string(),
            '`' | '$' | '"' | '\\' => format!("`{}", c),
            '\n' => "`n".to_string(),
            '\r' => "`r".to_string(),
            '\t' => "`t".to_string(),
            '\0' => "".to_string(), // Remove null bytes
            _ => c.to_string(),
        })
        .collect()
}

#[cfg(target_os = "windows")]
fn spawn_tts_process(text: &str, rate: f32) -> std::io::Result<Child> {
    let sapi_rate = ((rate - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
    let escaped_text = escape_powershell(text);
    let script = format!(
        "Add-Type -AssemblyName System.Speech; \
         $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; \
         $synth.Rate = {}; \
         $synth.Speak('{}')",
        sapi_rate, escaped_text
    );

    Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .creation_flags(CREATE_NO_WINDOW)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn spawn_tts_process(_text: &str, _rate: f32) -> std::io::Result<Child> {
    Err(std::io::Error::new(std::io::ErrorKind::Unsupported, "TTS not supported on this platform"))
}

#[tauri::command]
pub fn speak(text: String, rate: f32, state: State<'_, AppState>) -> Result<(), String> {
    // 1. Stop existing speech
    kill_active_tts(&state)?;

    // 2. Spawn new speech process
    match spawn_tts_process(&text, rate) {
        Ok(child) => {
            let mut guard = state.tts_process.lock()
                .map_err(|_| "TTS state mutex poisoned".to_string())?;
            *guard = Some(child);
            Ok(())
        }
        Err(e) => Err(format!("Failed to start TTS: {}", e)),
    }
}

#[tauri::command]
pub fn tts_stop(state: State<AppState>) -> Result<(), String> {
    kill_active_tts(&state)
}

#[cfg(test)]
mod tests {
    #[cfg(target_os = "windows")]
    use super::escape_powershell;

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell() {
        assert_eq!(escape_powershell("hello"), "hello");
        assert_eq!(escape_powershell("it's"), "it''s");
        assert_eq!(escape_powershell("$var"), "`$var");
        assert_eq!(escape_powershell("`backtick"), "``backtick");
        assert_eq!(escape_powershell("line\nbreak"), "line`nbreak");
        assert_eq!(escape_powershell("test\"quote"), "test`\"quote");
        assert_eq!(escape_powershell("back\\slash"), "back`\\slash");
        assert_eq!(escape_powershell("tab\there"), "tab`there");
        assert_eq!(escape_powershell("null\0byte"), "nullbyte");
    }

    #[test]
    fn test_rate_clamping() {
        // Rate should be clamped to reasonable SAPI values (-10 to 10)
        let low_rate = ((0.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(low_rate, -5);

        let normal_rate = ((1.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(normal_rate, 0);

        let high_rate = ((3.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(high_rate, 10);

        // Extreme values should be clamped
        let extreme_high = ((10.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(extreme_high, 10);
    }

    #[test]
    fn test_macos_wpm_calculation() {
        // macOS uses WPM = rate * 200
        let slow_wpm = (0.5_f32 * 200.0) as i32;
        assert_eq!(slow_wpm, 100);

        let normal_wpm = (1.0_f32 * 200.0) as i32;
        assert_eq!(normal_wpm, 200);

        let fast_wpm = (2.0_f32 * 200.0) as i32;
        assert_eq!(fast_wpm, 400);
    }
}