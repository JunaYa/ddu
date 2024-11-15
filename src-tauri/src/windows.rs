use tauri::{window::Color, TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

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
