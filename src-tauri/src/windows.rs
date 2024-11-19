use std::time::Instant;
use tauri::{window::Color, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use xcap::Monitor;
use xcap::Window;

pub fn create_window(app: &mut tauri::App) -> Result<(), tauri::Error> {
    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
        .title("ddu")
        .title_bar_style(TitleBarStyle::Transparent)
        .background_color(Color(10, 100, 100, 1))
        .inner_size(800.0, 600.0);

    let window = win_builder.build().unwrap();

    // set background color only when building for macOS
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSColor, NSWindow};
        use cocoa::base::{id, nil};

        let ns_window = window.ns_window().unwrap() as id;
        unsafe {
            let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                nil,
                50.0 / 255.0,
                158.0 / 255.0,
                163.5 / 255.0,
                0.5,
            );
            ns_window.setBackgroundColor_(bg_color);
        }
    }

    Ok(())
}

pub fn display_windows() {
    let start = Instant::now();
    let windows = Window::all().unwrap();
    println!("Window::all() 运行耗时: {:?}", start.elapsed());

    for window in windows {
        println!(
            "Window:\n id: {}\n title: {}\n app_name: {}\n monitor: {:?}\n position: {:?}\n size {:?}\n state {:?}\n",
            window.id(),
            window.title(),
            window.app_name(),
            window.current_monitor().name(),
            (window.x(), window.y()),
            (window.width(), window.height()),
            (window.is_minimized(), window.is_maximized())
        );
    }

    println!("运行耗时: {:?}", start.elapsed());
}

pub fn display_monitors() {
    let start = Instant::now();
    let monitors = Monitor::all().unwrap();
    println!("Monitor::all() 运行耗时: {:?}", start.elapsed());

    for monitor in monitors {
        println!(
            "Monitor:\n id: {}\n name: {}\n position: {:?}\n size: {:?}\n state:{:?}\n",
            monitor.id(),
            monitor.name(),
            (monitor.x(), monitor.y()),
            (monitor.width(), monitor.height()),
            (
                monitor.rotation(),
                monitor.scale_factor(),
                monitor.frequency(),
                monitor.is_primary()
            )
        );
    }

    let monitor = Monitor::from_point(100, 100).unwrap();

    println!("Monitor::from_point(): {}", monitor.name());
    println!(
        "Monitor::from_point(100, 100) 运行耗时: {:?}",
        start.elapsed()
    );

    println!("运行耗时: {:?}", start.elapsed());
}
