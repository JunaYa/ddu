//! Run on a macOS desktop with `cargo run --example window_lifecycle_smoke`.
//! Exercises the zero-window gap after capture and closing the last preview.
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[path = "../src/lifecycle.rs"]
mod lifecycle;

fn main() {
    // Fail rather than hang if explicit Quit is accidentally prevented.
    std::thread::spawn(|| {
        std::thread::sleep(Duration::from_secs(15));
        eprintln!("FAIL: window lifecycle check timed out");
        std::process::exit(1);
    });
    let completed = Arc::new(AtomicBool::new(false));
    let worker_completed = completed.clone();
    let app = tauri::Builder::default()
        .setup(move |app| {
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                for label in ["capture", "preview", "preview"] {
                    let window = WebviewWindowBuilder::new(
                        &handle,
                        label,
                        WebviewUrl::External("about:blank".parse().unwrap()),
                    )
                    .visible(false)
                    .build()
                    .unwrap();
                    std::thread::sleep(Duration::from_millis(300));
                    if label == "capture" {
                        window.destroy().unwrap();
                    } else {
                        window.close().unwrap();
                    }
                    // Let the event loop observe that no windows remain.
                    std::thread::sleep(Duration::from_millis(300));
                    assert!(handle.get_webview_window(label).is_none());
                }
                worker_completed.store(true, Ordering::SeqCst);
                handle.exit(0);
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .unwrap();
    app.run(move |_, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            if !completed.load(Ordering::SeqCst) {
                eprintln!("FAIL: app exited when its last capture/preview window closed");
                std::process::exit(1);
            }
            println!("PASS: capture teardown, repeated preview close, and explicit quit");
        }
        lifecycle::handle_run_event(event);
    });
}
