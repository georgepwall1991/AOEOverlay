use std::process::Command;

/// Speak text using native TTS
/// - macOS: uses `say` command
/// - Windows: uses PowerShell with System.Speech
#[cfg(target_os = "macos")]
pub fn speak_native(text: &str, rate: f32) -> Result<(), String> {
    // macOS 'say' rate: words per minute, default ~175-200
    // rate 1.0 = 200 wpm, 0.5 = 100 wpm, 2.0 = 400 wpm
    let wpm = (rate * 200.0) as i32;

    Command::new("say")
        .args(["-r", &wpm.to_string(), text])
        .status()
        .map_err(|e| format!("Failed to execute say command: {}", e))?;

    Ok(())
}

#[cfg(target_os = "windows")]
pub fn speak_native(text: &str, rate: f32) -> Result<(), String> {
    // Windows SAPI rate: -10 to 10, default 0
    // rate 1.0 = 0, 0.5 = -5, 2.0 = 5
    let sapi_rate = ((rate - 1.0) * 5.0) as i32;

    // Escape single quotes for PowerShell
    let escaped_text = text.replace("'", "''");

    let script = format!(
        "Add-Type -AssemblyName System.Speech; \
         $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; \
         $synth.Rate = {}; \
         $synth.Speak('{}')",
        sapi_rate, escaped_text
    );

    Command::new("powershell")
        .args(["-Command", &script])
        .status()
        .map_err(|e| format!("Failed to execute PowerShell: {}", e))?;

    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn speak_native(_text: &str, _rate: f32) -> Result<(), String> {
    // Linux/other platforms: no-op for now
    // Could integrate espeak or festival in the future
    Ok(())
}

/// Stop any currently speaking TTS
#[cfg(target_os = "macos")]
pub fn stop_speaking() -> Result<(), String> {
    // Kill all 'say' processes
    Command::new("pkill")
        .args(["-f", "say"])
        .spawn()
        .map_err(|e| format!("Failed to stop speech: {}", e))?;

    Ok(())
}

#[cfg(target_os = "windows")]
pub fn stop_speaking() -> Result<(), String> {
    // Note: Safely stopping Windows TTS without killing unrelated processes is complex.
    // For now, we don't forcefully stop - the speech will complete naturally.
    // A proper solution would use the `tts` crate or track spawned PIDs.
    // See: https://crates.io/crates/tts
    Ok(())
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub fn stop_speaking() -> Result<(), String> {
    Ok(())
}

// Tauri commands

#[tauri::command]
pub async fn speak(text: String, rate: f32) -> Result<(), String> {
    // This runs on a thread pool, so blocking is fine
    speak_native(&text, rate)
}

#[tauri::command]
pub fn tts_stop() -> Result<(), String> {
    stop_speaking()
}
