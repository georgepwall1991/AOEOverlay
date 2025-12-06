use std::sync::Mutex;
use std::process::Child;
use crate::config::{AppConfig, BuildOrder};

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub build_orders: Mutex<Vec<BuildOrder>>,
    pub tts_process: Mutex<Option<Child>>,
}
