use std::process::{Child, Command, Stdio};
use tauri::State;
use crate::state::AppState;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn kill_active_tts(state: &State<AppState>) {
    let mut tts_process = match state.tts_process.lock() {
        Ok(guard) => guard,
        Err(_) => return, // Mutex poisoned, nothing we can do
    };

    if let Some(mut child) = tts_process.take() {
        let _ = child.kill();
        let _ = child.wait(); // Clean up zombie
    }
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
fn spawn_tts_process(text: &str, rate: f32) -> std::io::Result<Child> {
    let sapi_rate = ((rate - 1.0) * 5.0) as i32;
    let escaped_text = text.replace("'", "''");
    let script = format!(
        "Add-Type -AssemblyName System.Speech; \n         $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; \n         $synth.Rate = {}; \n         $synth.Speak('{}')",
        sapi_rate, escaped_text
    );

    Command::new("powershell")
        .args(["-Command", &script])
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
pub async fn speak(text: String, rate: f32, state: State<'_, AppState>) -> Result<(), String> {
    // 1. Stop existing speech
    kill_active_tts(&state);

    // 2. Spawn new speech process
    match spawn_tts_process(&text, rate) {
        Ok(child) => {
            if let Ok(mut guard) = state.tts_process.lock() {
                *guard = Some(child);
            }
            Ok(())
        }
        Err(e) => Err(format!("Failed to start TTS: {}", e)),
    }
}

#[tauri::command]
pub fn tts_stop(state: State<AppState>) -> Result<(), String> {
    kill_active_tts(&state);
    Ok(())
}