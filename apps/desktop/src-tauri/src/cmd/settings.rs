use serde_json::{json, Value};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_store::StoreExt;

fn readable(key: &str) -> bool {
    matches!(
        key,
        "screenshot_path"
            | "capture_delay"
            | "include_cursor"
            | "naming_template"
            | "hotkey_fullscreen"
            | "hotkey_region"
            | "hotkey_window"
            | "history_retention_days"
            | "history_cleanup_enabled"
            | "ocr_index_enabled"
            | "first_run"
    )
}

fn validate_write(key: &str, value: &Value) -> Result<(), String> {
    let valid = match key {
        "include_cursor" | "history_cleanup_enabled" | "ocr_index_enabled" => value.is_boolean(),
        "capture_delay" => value.as_u64().is_some_and(|n| n <= 3600),
        "history_retention_days" => value.as_i64().is_some_and(|n| (-1..=36500).contains(&n)),
        "hotkey_fullscreen" | "hotkey_region" | "hotkey_window" => value
            .as_str()
            .is_some_and(|s| !s.is_empty() && s.len() <= 256),
        "naming_template" => value.as_str().is_some_and(|s| s.len() <= 1024),
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err("setting is read-only or has an invalid value".into())
    }
}

#[tauri::command]
pub fn read_setting(app: tauri::AppHandle, key: String) -> Result<Option<Value>, String> {
    if !readable(&key) {
        return Err("unknown setting".into());
    }
    Ok(app
        .get_store("settings.json")
        .ok_or("settings unavailable")?
        .get(key))
}

#[tauri::command]
pub fn write_setting(app: tauri::AppHandle, key: String, value: Value) -> Result<(), String> {
    validate_write(&key, &value)?;
    let store = app
        .get_store("settings.json")
        .ok_or("settings unavailable")?;
    store.set(key, json!({ "value": value }));
    store.save().map_err(|e| e.to_string())
}

/// Only the native picker can supply a new storage root. Renderer IPC accepts no path.
#[tauri::command]
pub async fn choose_screenshot_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let picker = app.clone();
    let selected = tauri::async_runtime::spawn_blocking(move || {
        picker
            .dialog()
            .file()
            .set_title("选择截图保存目录")
            .blocking_pick_folder()
    })
    .await
    .map_err(|e| e.to_string())?;
    let Some(selected) = selected else {
        return Ok(None);
    };
    let path = selected.into_path().map_err(|e| e.to_string())?;
    let path = std::fs::canonicalize(path).map_err(|e| e.to_string())?;
    if !path.is_dir() {
        return Err("not a directory".into());
    }
    let value = path.to_string_lossy().to_string();
    let store = app
        .get_store("settings.json")
        .ok_or("settings unavailable")?;
    store.set("screenshot_path", json!({ "value": value }));
    store.save().map_err(|e| e.to_string())?;
    Ok(Some(value))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn renderer_cannot_change_the_root_or_hidden_store_values() {
        for key in ["screenshot_path", "workflow_rules", "first_run", "unknown"] {
            assert!(validate_write(key, &json!("/tmp")).is_err());
        }
        assert!(validate_write("include_cursor", &json!(true)).is_ok());
        assert!(validate_write("capture_delay", &json!(3)).is_ok());
        assert!(validate_write("capture_delay", &json!(-1)).is_err());
        assert!(validate_write("hotkey_region", &json!("CmdOrCtrl+Shift+S")).is_ok());
    }
}
