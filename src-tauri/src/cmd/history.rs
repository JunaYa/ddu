use std::fs;
use std::time::{Duration, SystemTime};

use serde::{Deserialize, Serialize};
use tauri_plugin_store::StoreExt;
use tracing::info;

use crate::common::get_images_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: String,
    pub filename: String,
    pub full_path: String,
    pub width: u32,
    pub height: u32,
    pub file_size: u64,
    pub mode: String,
    pub captured_at: String,
    pub favorite: bool,
    pub tags: Vec<String>,
}

#[tauri::command]
pub async fn list_history_items(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<Vec<HistoryItem>, String> {
    let images_dir = get_images_dir(&app_handle, path)?;

    if !images_dir.exists() {
        return Ok(vec![]);
    }

    let mut items: Vec<HistoryItem> = Vec::new();

    let entries = fs::read_dir(&images_dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !matches!(ext.to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp") {
            continue;
        }

        let filename = path.file_name().unwrap().to_string_lossy().to_string();
        let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
        let file_size = metadata.len();

        let (width, height) = image::image_dimensions(&path).unwrap_or((0, 0));

        let mode = if filename.contains("screenshot") {
            "capture".to_string()
        } else if filename.contains("annotated") {
            "edited".to_string()
        } else {
            "unknown".to_string()
        };

        let captured_at = metadata
            .created()
            .or_else(|_| metadata.modified())
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Local> = t.into();
                datetime.to_rfc3339()
            })
            .unwrap_or_default();

        items.push(HistoryItem {
            id: filename.clone(),
            filename,
            full_path: path.to_string_lossy().to_string(),
            width,
            height,
            file_size,
            mode,
            captured_at,
            favorite: false,
            tags: vec![],
        });
    }

    items.sort_by(|a, b| b.captured_at.cmp(&a.captured_at));

    info!("Listed {} history items", items.len());
    Ok(items)
}

/// Delete captures older than the configured retention period.
///
/// Safety gates (the history was an inert setting for a long time, so users have
/// accumulated files under zero enforcement):
/// - Runs only when the user explicitly opted in (`history_cleanup_enabled`).
/// - `history_retention_days` of `-1`, `0`, negative, or missing => no deletion.
/// - Only files matching app-generated names (`screenshot_*` / `*_annotated.*`)
///   inside the controlled directory are eligible, so a user's own images in a
///   shared save folder are never collateral.
pub fn prune_history(app: &tauri::AppHandle) {
    let Some(store) = app.get_store("settings.json") else { return };

    let opted_in = store
        .get("history_cleanup_enabled")
        .and_then(|v| v.as_object().and_then(|o| o.get("value")).and_then(|x| x.as_bool()))
        .unwrap_or(false);
    if !opted_in {
        return;
    }

    let days = store
        .get("history_retention_days")
        .and_then(|v| v.as_object().and_then(|o| o.get("value")).and_then(|x| x.as_i64()))
        .unwrap_or(-1);
    if days <= 0 {
        // -1 = keep forever; 0 / negative = invalid => never delete.
        return;
    }

    let Ok(images_dir) = get_images_dir(app, "images".to_string()) else { return };
    let Some(cutoff) = SystemTime::now().checked_sub(Duration::from_secs(days as u64 * 86_400))
    else {
        return;
    };
    let Ok(entries) = fs::read_dir(&images_dir) else { return };

    let mut removed = 0u32;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let ext_ok = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| matches!(e.to_lowercase().as_str(), "png" | "jpg" | "jpeg" | "webp"))
            .unwrap_or(false);
        let name_ok = path
            .file_name()
            .and_then(|n| n.to_str())
            .map(|n| n.starts_with("screenshot_") || n.contains("_annotated"))
            .unwrap_or(false);
        if !ext_ok || !name_ok {
            continue;
        }
        let Ok(modified) = fs::metadata(&path).and_then(|m| m.modified()) else { continue };
        if modified < cutoff
            && crate::common::ensure_within_images_dir(app, &path).is_ok()
            && fs::remove_file(&path).is_ok()
        {
            removed += 1;
        }
    }
    if removed > 0 {
        info!("Retention pruning removed {} old captures", removed);
    }
}

#[tauri::command]
pub async fn delete_history_items(
    app_handle: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<u32, String> {
    let mut deleted = 0u32;
    for path in &paths {
        match crate::common::ensure_within_images_dir(&app_handle, std::path::Path::new(path)) {
            Ok(guarded) => {
                if fs::remove_file(&guarded).is_ok() {
                    deleted += 1;
                }
            }
            Err(e) => info!("Refusing to delete out-of-bounds path {}: {}", path, e),
        }
    }
    info!("Deleted {} history items", deleted);
    Ok(deleted)
}

#[tauri::command]
pub async fn get_history_item_detail(
    app_handle: tauri::AppHandle,
    path: String,
) -> Result<HistoryItem, String> {
    let guarded = crate::common::ensure_within_images_dir(&app_handle, std::path::Path::new(&path))?;
    let path_ref = guarded.as_path();
    if !path_ref.exists() {
        return Err("File not found".to_string());
    }

    let filename = path_ref.file_name().unwrap().to_string_lossy().to_string();
    let metadata = fs::metadata(path_ref).map_err(|e| e.to_string())?;
    let (width, height) = image::image_dimensions(path_ref).unwrap_or((0, 0));

    let captured_at = metadata
        .created()
        .or_else(|_| metadata.modified())
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Local> = t.into();
            datetime.to_rfc3339()
        })
        .unwrap_or_default();

    Ok(HistoryItem {
        id: filename.clone(),
        filename,
        full_path: guarded.to_string_lossy().to_string(),
        width,
        height,
        file_size: metadata.len(),
        mode: "capture".to_string(),
        captured_at,
        favorite: false,
        tags: vec![],
    })
}
