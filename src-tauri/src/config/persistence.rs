use std::fs;
use std::io::{ErrorKind, Write};
use std::path::PathBuf;

use super::app_config::AppConfig;
use super::build_order::{validate_build_order, BuildOrder};

pub fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

pub fn get_build_orders_dir() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("aoe4-overlay")
        .join("build-orders");
    fs::create_dir_all(&config_dir).ok();
    config_dir
}

pub fn load_config() -> AppConfig {
    let config_path = get_config_path();
    if config_path.exists() {
        if let Ok(content) = fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str(&content) {
                return config;
            }
        }
    }
    AppConfig::default()
}

pub fn atomic_write<P: AsRef<std::path::Path>, C: AsRef<[u8]>>(path: P, content: C) -> std::io::Result<()> {
    let path = path.as_ref();
    // Create a temp file in the same directory to ensure we can rename it (atomic move)
    let tmp_path = path.with_extension("tmp");

    {
        let mut file = fs::File::create(&tmp_path)?;
        file.write_all(content.as_ref())?;
        file.sync_all()?; // Ensure data is on disk
    }

    // On Windows, rename fails if the destination exists; remove it first.
    let rename_result = fs::rename(&tmp_path, path);
    if rename_result.is_ok() {
        return Ok(());
    }

    let err = rename_result.unwrap_err();
    if cfg!(target_os = "windows") && (err.kind() == ErrorKind::AlreadyExists || err.kind() == ErrorKind::PermissionDenied) {
        // Best-effort cleanup before retry
        if path.exists() {
            fs::remove_file(path)?;
        }
        fs::rename(&tmp_path, path)?;
        return Ok(());
    }

    // Cleanup temp file on failure
    let _ = fs::remove_file(&tmp_path);
    Err(err)
}

pub fn load_build_orders() -> Vec<BuildOrder> {
    let dir = get_build_orders_dir();
    let mut orders = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if entry.path().extension().is_some_and(|e| e == "json") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    match serde_json::from_str::<BuildOrder>(&content) {
                        Ok(order) => {
                            if let Err(err) = validate_build_order(&order) {
                                eprintln!(
                                    "Skipping invalid build order {:?}: {}",
                                    entry.path(),
                                    err
                                );
                                continue;
                            }
                            orders.push(order);
                        }
                        Err(err) => {
                            eprintln!("Skipping invalid build order {:?}: {}", entry.path(), err);
                        }
                    };
                }
            }
        }
    }
    orders
}
