//! Windows-specific functionality for the overlay application.

mod game_detection;
mod setup;

pub use game_detection::apply_overlay_visibility;
pub use game_detection::start_game_detection;
pub use setup::force_layered_alpha_opaque;
pub use setup::setup_overlay_window;
