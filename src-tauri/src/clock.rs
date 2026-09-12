use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};

use crate::commands::with_conn;
use crate::state::AppState;

pub fn run(app: &AppHandle) {
    let state = app.state::<AppState>();
    let changed = with_conn(&state, crate::tasks::clock_tick).unwrap_or(false);
    if changed {
        let _ = app.emit("tasks-changed", ());
    }
}

pub fn spawn(app: &AppHandle) {
    run(app);
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
            run(&handle);
        }
    });
}
