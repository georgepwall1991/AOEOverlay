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

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_empty_string() {
        assert_eq!(escape_powershell(""), "");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_unicode() {
        assert_eq!(escape_powershell("hello world"), "hello world");
        assert_eq!(escape_powershell("émojis"), "émojis");
        assert_eq!(escape_powershell("日本語"), "日本語");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_multiple_special_chars() {
        assert_eq!(escape_powershell("$a$b$c"), "`$a`$b`$c");
        assert_eq!(escape_powershell("'''"), "''''''");
        assert_eq!(escape_powershell("\n\r\t"), "`n`r`t");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_carriage_return() {
        assert_eq!(escape_powershell("\r"), "`r");
        assert_eq!(escape_powershell("line\r\nend"), "line`r`nend");
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
    fn test_rate_clamping_negative_extreme() {
        let extreme_low = ((-5.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(extreme_low, -10);
    }

    #[test]
    fn test_rate_clamping_boundary() {
        // Test boundary values
        let at_lower_bound = ((-1.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(at_lower_bound, -10);

        let at_upper_bound = ((3.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(at_upper_bound, 10);
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

    #[test]
    fn test_macos_wpm_edge_cases() {
        // Very slow
        let very_slow = (0.1_f32 * 200.0) as i32;
        assert_eq!(very_slow, 20);

        // Very fast
        let very_fast = (5.0_f32 * 200.0) as i32;
        assert_eq!(very_fast, 1000);

        // Zero rate
        let zero = (0.0_f32 * 200.0) as i32;
        assert_eq!(zero, 0);
    }

    #[test]
    fn test_rate_to_sapi_conversion() {
        // SAPI rate formula: (rate - 1.0) * 5.0
        // rate 1.0 = SAPI 0 (normal)
        // rate 2.0 = SAPI 5
        // rate 0.5 = SAPI -2.5 -> -2
        let normal = ((1.0_f32 - 1.0) * 5.0) as i32;
        assert_eq!(normal, 0);

        let double_speed = ((2.0_f32 - 1.0) * 5.0) as i32;
        assert_eq!(double_speed, 5);

        let half_speed = ((0.5_f32 - 1.0) * 5.0) as i32;
        assert_eq!(half_speed, -2);
    }

    // OS-specific TTS availability tests
    #[cfg(target_os = "macos")]
    #[test]
    fn test_macos_say_command_available() {
        // Test that the 'say' command exists on macOS
        let output = std::process::Command::new("which")
            .arg("say")
            .output();
        assert!(output.is_ok(), "Should be able to run 'which say'");
        let output = output.unwrap();
        assert!(output.status.success(), "say command should exist on macOS");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_windows_powershell_available() {
        // Test that PowerShell exists on Windows
        let output = std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", "echo test"])
            .output();
        assert!(output.is_ok(), "Should be able to run PowerShell");
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    #[test]
    fn test_linux_tts_unsupported() {
        // On Linux/other platforms, TTS should return an error
        let result = super::spawn_tts_process("test", 1.0);
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert_eq!(err.kind(), std::io::ErrorKind::Unsupported);
    }

    // Additional edge case tests

    #[test]
    fn test_rate_negative_value() {
        // Negative rate should clamp to minimum
        let negative_rate = ((-2.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(negative_rate, -10);
    }

    #[test]
    fn test_rate_fractional_values() {
        // Test fractional rate values
        let rate_1_25 = ((1.25_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(rate_1_25, 1);

        let rate_1_5 = ((1.5_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(rate_1_5, 2);

        let rate_0_75 = ((0.75_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(rate_0_75, -1);
    }

    #[test]
    fn test_rate_very_large() {
        // Very large rate should clamp to max
        let huge_rate = ((100.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(huge_rate, 10);
    }

    #[test]
    fn test_macos_wpm_negative_rate() {
        // Negative rate produces negative WPM (unlikely in practice but test math)
        let negative_wpm = (-1.0_f32 * 200.0) as i32;
        assert_eq!(negative_wpm, -200);
    }

    #[test]
    fn test_macos_wpm_fractional_rate() {
        // Fractional rates
        let wpm_1_5 = (1.5_f32 * 200.0) as i32;
        assert_eq!(wpm_1_5, 300);

        let wpm_0_25 = (0.25_f32 * 200.0) as i32;
        assert_eq!(wpm_0_25, 50);
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_all_special_chars_combined() {
        // Combine all special chars that need escaping
        let result = escape_powershell("$`\"'\\\n\r\t\0");
        assert_eq!(result, "`$```\"`'''`\\`n`r`t");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_long_string() {
        // Test with a long string
        let long_text = "a".repeat(1000);
        let result = escape_powershell(&long_text);
        assert_eq!(result.len(), 1000);
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_single_quotes_sequence() {
        // Multiple single quotes in sequence
        assert_eq!(escape_powershell("''''"), "''''''''");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_mixed_escapes() {
        // Real-world text with mixed special chars
        let text = "Build 5 villagers! Then say: \"Go!\"";
        let result = escape_powershell(text);
        assert!(result.contains("`\""));
        assert!(!result.contains("\n")); // No literal newlines
    }

    #[test]
    fn test_sapi_rate_precision() {
        // Test that integer conversion is predictable
        let rate_1_1 = ((1.1_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        // 0.1 * 5.0 = 0.5, as i32 = 0
        assert_eq!(rate_1_1, 0);

        let rate_1_2 = ((1.2_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        // 0.2 * 5.0 = 1.0, as i32 = 1
        assert_eq!(rate_1_2, 1);
    }

    #[test]
    fn test_sapi_rate_at_clamp_boundaries() {
        // Just above lower boundary (rate that gives exactly -10)
        let at_min = ((-1.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(at_min, -10);

        // Just below upper boundary (rate that gives exactly 10)
        let at_max = ((3.0_f32 - 1.0) * 5.0).clamp(-10.0, 10.0) as i32;
        assert_eq!(at_max, 10);
    }
}