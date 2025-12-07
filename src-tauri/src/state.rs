use std::sync::Mutex;
use std::process::Child;
use crate::config::{AppConfig, BuildOrder};

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub build_orders: Mutex<Vec<BuildOrder>>,
    pub tts_process: Mutex<Option<Child>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_creation() {
        let state = AppState {
            config: Mutex::new(AppConfig::default()),
            build_orders: Mutex::new(Vec::new()),
            tts_process: Mutex::new(None),
        };

        // Verify we can lock and access the config
        let config = state.config.lock().unwrap();
        assert!(config.hotkeys.toggle_overlay.len() > 0);
    }

    #[test]
    fn test_app_state_config_mutex() {
        let state = AppState {
            config: Mutex::new(AppConfig::default()),
            build_orders: Mutex::new(Vec::new()),
            tts_process: Mutex::new(None),
        };

        // Lock and modify config
        {
            let mut config = state.config.lock().unwrap();
            config.click_through = true;
        }

        // Lock again and verify change persisted
        let config = state.config.lock().unwrap();
        assert!(config.click_through);
    }

    #[test]
    fn test_app_state_build_orders_mutex() {
        let state = AppState {
            config: Mutex::new(AppConfig::default()),
            build_orders: Mutex::new(Vec::new()),
            tts_process: Mutex::new(None),
        };

        // Start with empty build orders
        {
            let orders = state.build_orders.lock().unwrap();
            assert_eq!(orders.len(), 0);
        }

        // Add a build order
        {
            let mut orders = state.build_orders.lock().unwrap();
            orders.push(BuildOrder {
                id: "test-build".to_string(),
                name: "Test Build".to_string(),
                civilization: "English".to_string(),
                description: "Test description".to_string(),
                difficulty: "Beginner".to_string(),
                enabled: true,
                steps: vec![],
                pinned: false,
                favorite: false,
                branches: None,
            });
        }

        // Verify it was added
        let orders = state.build_orders.lock().unwrap();
        assert_eq!(orders.len(), 1);
        assert_eq!(orders[0].id, "test-build");
    }

    #[test]
    fn test_app_state_tts_process_mutex() {
        let state = AppState {
            config: Mutex::new(AppConfig::default()),
            build_orders: Mutex::new(Vec::new()),
            tts_process: Mutex::new(None),
        };

        // Initially no TTS process
        let process = state.tts_process.lock().unwrap();
        assert!(process.is_none());
    }

    #[test]
    fn test_concurrent_access_simulation() {
        use std::sync::Arc;
        use std::thread;

        let state = Arc::new(AppState {
            config: Mutex::new(AppConfig::default()),
            build_orders: Mutex::new(Vec::new()),
            tts_process: Mutex::new(None),
        });

        let state_clone = Arc::clone(&state);
        let handle = thread::spawn(move || {
            let config = state_clone.config.lock().unwrap();
            // Read config in another thread
            config.click_through
        });

        // Main thread also reads
        let config = state.config.lock().unwrap();
        let _ = config.click_through;
        drop(config); // Release lock

        // Wait for other thread
        let _ = handle.join().unwrap();
    }
}
