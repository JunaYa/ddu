/// Ddu lives in the tray even when no windows exist. In particular, capture
/// finalization destroys its overlay before creating the preview, and the
/// preview may itself be the last window when the user closes it.
pub fn handle_run_event(event: tauri::RunEvent) {
    if let tauri::RunEvent::ExitRequested {
        code: None, api, ..
    } = event
    {
        api.prevent_exit();
    }
    // Explicit app.exit(code) (the Quit menu) and app.restart() carry a code
    // and must remain allowed.
}
