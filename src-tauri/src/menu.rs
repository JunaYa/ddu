use std::str::FromStr;

use strum_macros::{Display, EnumString};
use tauri::{
    menu::{Menu, MenuEvent, MenuItem},
    tray::{TrayIcon, TrayIconEvent},
    AppHandle,
};

#[derive(Debug, Display, EnumString)]
#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
enum MenuID {
    CAPTURE_SCREEN,
    CAPTURE_SELECT,
    CAPTURE_WINDOW,
    SETTING_MANAGER,
    EXIT,
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
    let menu = Menu::with_id(app, "app_menu")?;

    Ok(menu)
}

pub fn handle_tray_icon_events(tray: &TrayIcon, event: TrayIconEvent) {
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
        }
    }
}
