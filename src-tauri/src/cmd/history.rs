use std::fs;
use serde::{Deserialize, Serialize};
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

#[tauri::command]
pub async fn delete_history_items(paths: Vec<String>) -> Result<u32, String> {
    let mut deleted = 0u32;
    for path in &paths {
        if fs::remove_file(path).is_ok() {
            deleted += 1;
        }
    }
    info!("Deleted {} history items", deleted);
    Ok(deleted)
}

#[tauri::command]
pub async fn get_history_item_detail(path: String) -> Result<HistoryItem, String> {
    let path_ref = std::path::Path::new(&path);
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
        full_path: path.clone(),
        width,
        height,
        file_size: metadata.len(),
        mode: "capture".to_string(),
        captured_at,
        favorite: false,
        tags: vec![],
    })
}
