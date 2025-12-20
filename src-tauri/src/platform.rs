/// Platform-specific utilities shared across modules.

/// Escapes a string for safe use in PowerShell single-quoted strings.
/// Handles special characters that could cause command injection or parsing issues.
#[cfg(target_os = "windows")]
pub fn escape_powershell(text: &str) -> String {
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

#[cfg(test)]
mod tests {
    #[cfg(target_os = "windows")]
    use super::*;

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_basic() {
        assert_eq!(escape_powershell("hello"), "hello");
        assert_eq!(escape_powershell(""), "");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_single_quotes() {
        assert_eq!(escape_powershell("it's"), "it''s");
        assert_eq!(escape_powershell("'''"), "''''''");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_special_chars() {
        assert_eq!(escape_powershell("$var"), "`$var");
        assert_eq!(escape_powershell("`backtick"), "``backtick");
        assert_eq!(escape_powershell("test\"quote"), "test`\"quote");
        assert_eq!(escape_powershell("back\\slash"), "back`\\slash");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_whitespace() {
        assert_eq!(escape_powershell("line\nbreak"), "line`nbreak");
        assert_eq!(escape_powershell("tab\there"), "tab`there");
        assert_eq!(escape_powershell("\r"), "`r");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_null_byte() {
        assert_eq!(escape_powershell("null\0byte"), "nullbyte");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_unicode() {
        assert_eq!(escape_powershell("hello world"), "hello world");
        assert_eq!(escape_powershell("日本語"), "日本語");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn test_escape_powershell_path_injection() {
        // Verify that injection attempts are neutralized
        let malicious = "'; Remove-Item -Recurse C:\\; '";
        let escaped = escape_powershell(malicious);
        // The single quotes should be doubled, preventing breakout
        assert!(escaped.contains("''"));
        assert!(!escaped.contains("'; "));
    }
}
