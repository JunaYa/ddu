use std::time::Instant;
use tauri::{window::Color, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};
use tauri::{AppHandle, PhysicalPosition, WebviewWindow};
use xcap::Monitor;
use xcap::Window;


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

