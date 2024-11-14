use std::str::FromStr;

use strum_macros::{Display, EnumString};
use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu},
    tray::{TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

#[derive(Debug, Display, EnumString)]
#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
enum MenuID {
    CAPTURE_SCREEN,
    CAPTURE_SELECT,
    CAPTURE_WINDOW,
    SETTING_MANAGER,
    SETTINGS,
    HELP,
    FEEDBACK,
    EXIT,
}

pub fn create_tray(app: &mut tauri::App) -> Result<(), tauri::Error> {
    let _ = TrayIconBuilder::with_id("main-tray")
        .menu(&get_tray_menu(app.handle())?)
        .icon(app.default_window_icon().unwrap().clone())
        .icon_as_template(true)
        .menu_on_left_click(true)
        .on_menu_event(handle_tray_menu_events)
        .on_tray_icon_event(handle_tray_icon_events)
        .build(app)?;
    Ok(())
}

pub fn get_tray_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let tray = Menu::with_id(app, "tray_menu")?;

    tray.append_items(&[
        &MenuItem::with_id(
            app,
            MenuID::CAPTURE_SCREEN.to_string(),
            "Capture Screen",
            true,
            None::<&str>,
        )?,
        &MenuItem::with_id(
            app,
            MenuID::CAPTURE_SELECT.to_string(),
            "Capture Select",
            true,
            None::<&str>,
        )?,
        &MenuItem::with_id(
            app,
            MenuID::CAPTURE_WINDOW.to_string(),
            "Capture Window",
            true,
            None::<&str>,
        )?,
        &MenuItem::with_id(
            app,
            MenuID::SETTING_MANAGER.to_string(),
            "Setting Manager",
            true,
            None::<&str>,
        )?,
        &MenuItem::with_id(app, MenuID::EXIT.to_string(), "Exit", true, None::<&str>)?,
    ])?;

    Ok(tray)
}

pub fn get_app_menu(app: &AppHandle) -> Result<Menu<tauri::Wry>, tauri::Error> {
    let app_menu = Menu::new(app)?;
    let menu = Submenu::with_items(
        app,
        "Ddu",
        true,
        &[
            &PredefinedMenuItem::about(app, Some("about"), Default::default())?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                MenuID::SETTINGS.to_string(),
                "Settings",
                true,
                None::<&str>,
            )?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )?;
    app_menu.append(&menu)?;

    // edit menu
    let edit_menu = Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::select_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
        ],
    )?;
    app_menu.append(&edit_menu)?;

    // help menu
    let help_menu = Submenu::with_items(
        app,
        "Help",
        true,
        &[
            &MenuItem::with_id(app, MenuID::HELP.to_string(), "Help", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(
                app,
                MenuID::FEEDBACK.to_string(),
                "Feedback",
                true,
                None::<&str>,
            )?,
        ],
    )?;
    app_menu.append(&help_menu)?;

    Ok(app_menu)
}

pub fn handle_tray_icon_events(_tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::DoubleClick { .. } = event {
        println!("Double click");
    }
}

pub fn handle_tray_menu_events(app: &AppHandle, event: MenuEvent) {
    let menu_id = if let Ok(menu_id) = MenuID::from_str(event.id.as_ref()) {
        menu_id
    } else {
        return;
    };

    match menu_id {
        MenuID::CAPTURE_SCREEN => {
            println!("Capture Screen");
        }
        MenuID::CAPTURE_SELECT => {
            println!("Capture Select");
        }
        MenuID::CAPTURE_WINDOW => {
            println!("Capture Window");
        }
        MenuID::SETTING_MANAGER => {
            println!("Setting Manager");
        }
        MenuID::EXIT => {
            println!("Exit");
            app.exit(0)
        }
        MenuID::SETTINGS => {
            println!("Settings");
            app.get_webview_window("setting").unwrap().show().unwrap();
        }
        MenuID::HELP => {
            println!("Help");
        }
        MenuID::FEEDBACK => {
            println!("Feedback");
        }
    }
}
