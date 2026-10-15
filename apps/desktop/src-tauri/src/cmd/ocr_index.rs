//! Local OCR text index for history search (spec OCR-006).
//!
//! One JSON file per screenshot under `<app local data>/ocr-index/`, named
//! after the screenshot's file name. Never written next to the screenshots:
//! the save folder may be a user-chosen shared directory.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::Manager;
use tauri_plugin_store::StoreExt;
use tracing::{info, warn};

use super::ocr::{recognize, OcrBlock, OcrResult, OAR_MODEL};
use crate::common::{ensure_within_images_dir, get_images_dir};

const INDEX_DIR: &str = "ocr-index";
const ENABLED_KEY: &str = "ocr_index_enabled";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcrIndexEntry {
    pub filename: String,
    pub text: String,
    /// `text` folded for matching; see [`normalize`].
    pub normalized: String,
    pub language: String,
    /// Mean block confidence; 1.0 when the engine reports none.
    pub confidence: f32,
    pub blocks: Vec<OcrBlock>,
    pub engine: String,
    pub engine_version: String,
    pub created_at: String,
}

impl OcrIndexEntry {
    fn new(filename: String, result: &OcrResult) -> Self {
        let confidence = if result.blocks.is_empty() {
            1.0
        } else {
            result.blocks.iter().map(|b| b.confidence).sum::<f32>() / result.blocks.len() as f32
        };
        let engine_version = match result.engine.as_str() {
            "oar-ocr" => format!("liteparse/{OAR_MODEL}"),
            "system" => "macos-vision".to_string(),
            other => other.to_string(),
        };
        Self {
            filename,
            normalized: normalize(&result.text),
            text: result.text.clone(),
            language: result.language.clone(),
            confidence,
            blocks: result.blocks.clone(),
            engine: result.engine.clone(),
            engine_version,
            created_at: chrono::Local::now().to_rfc3339(),
        }
    }
}

/// Fold text so searches survive OCR quirks: lowercase, full-width ASCII to
/// half-width, and drop all whitespace (OCR spacing is unreliable, and CJK
/// text has none to begin with).
pub fn normalize(text: &str) -> String {
    text.chars()
        .map(|c| match c {
            '\u{FF01}'..='\u{FF5E}' => char::from_u32(c as u32 - 0xFEE0).unwrap_or(c),
            _ => c,
        })
        .filter(|c| !c.is_whitespace())
        .flat_map(char::to_lowercase)
        .collect()
}

/// Indexing is on unless the user turned it off in settings.
pub fn index_enabled(app: &tauri::AppHandle) -> bool {
    app.get_store("settings.json")
        .and_then(|s| s.get(ENABLED_KEY))
        .and_then(|v| v.get("value").and_then(|x| x.as_bool()))
        .unwrap_or(true)
}

fn index_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_local_data_dir().map_err(|e| e.to_string())?.join(INDEX_DIR);
    crate::private_files::prepare_directory(&dir)?;
    Ok(dir)
}

fn entry_path(dir: &Path, image: &Path) -> Option<PathBuf> {
    let name = image.file_name()?.to_str()?;
    Some(dir.join(format!("{name}.json")))
}

/// Store `result` as the index entry for `image`. `image` must already be
/// path-guarded.
pub fn save(app: &tauri::AppHandle, image: &Path, result: &OcrResult) -> Result<(), String> {
    let dir = index_dir(app)?;
    let path = entry_path(&dir, image).ok_or("invalid image file name")?;
    let filename = image
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_vec(&OcrIndexEntry::new(filename, result)).map_err(|e| e.to_string())?;
    crate::private_files::atomic_write(&path, &json)
}

/// Drop the index entry for a screenshot that is being deleted.
pub fn remove(app: &tauri::AppHandle, image: &Path) {
    if let Some(path) = index_dir(app).ok().and_then(|dir| entry_path(&dir, image)) {
        let _ = fs::remove_file(path);
    }
}

fn read_entries(dir: &Path) -> Vec<(PathBuf, OcrIndexEntry)> {
    let Ok(read) = fs::read_dir(dir) else {
        return Vec::new();
    };
    read.flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_file()))
        .map(|e| e.path())
        .filter(|p| p.extension().is_some_and(|ext| ext == "json"))
        .filter_map(|p| {
            let entry = serde_json::from_slice(&fs::read(&p).ok()?).ok()?;
            Some((p, entry))
        })
        .collect()
}

/// Remove entries whose screenshot no longer exists — e.g. deleted through a
/// path that doesn't go through the backend. Runs at launch.
pub fn prune_ocr_index_orphans(app: &tauri::AppHandle) {
    let (Ok(dir), Ok(images)) = (index_dir(app), get_images_dir(app, "images".to_string())) else {
        return;
    };
    let mut removed = 0u32;
    for (path, entry) in read_entries(&dir) {
        if !images.join(&entry.filename).exists() && fs::remove_file(path).is_ok() {
            removed += 1;
        }
    }
    if removed > 0 {
        info!("Removed {removed} orphaned OCR index entries");
    }
}

/// OCR the given screenshots and index them. Returns how many were indexed.
#[tauri::command]
pub async fn ocr_index_items(app_handle: tauri::AppHandle, paths: Vec<String>) -> Result<u32, String> {
    if !index_enabled(&app_handle) {
        return Err("OCR index is turned off in settings".to_string());
    }
    let mut indexed = 0u32;
    for path in &paths {
        let guarded = match ensure_within_images_dir(&app_handle, Path::new(path)) {
            Ok(p) => p,
            Err(e) => {
                warn!("Refusing to index out-of-bounds path {path}: {e}");
                continue;
            }
        };
        match recognize(&guarded, None).await {
            Ok(result) => match save(&app_handle, &guarded, &result) {
                Ok(()) => indexed += 1,
                Err(e) => warn!("Failed to save OCR index for {path}: {e}"),
            },
            Err(e) => warn!("OCR failed for {path}: {e}"),
        }
    }
    info!("Indexed {indexed} of {} screenshots", paths.len());
    Ok(indexed)
}

/// File names of indexed screenshots whose text contains `query`.
#[tauri::command]
pub fn search_history_text(app_handle: tauri::AppHandle, query: String) -> Result<Vec<String>, String> {
    let needle = normalize(&query);
    if needle.is_empty() {
        return Ok(Vec::new());
    }
    Ok(read_entries(&index_dir(&app_handle)?)
        .into_iter()
        .filter(|(_, entry)| entry.normalized.contains(&needle))
        .map(|(_, entry)| entry.filename)
        .collect())
}

/// Delete every index entry (the user turned indexing off).
#[tauri::command]
pub fn clear_ocr_index(app_handle: tauri::AppHandle) -> Result<(), String> {
    let dir = index_dir(&app_handle)?;
    match fs::remove_dir_all(&dir) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_folds_case_width_and_whitespace() {
        assert_eq!(normalize("Error:  Connection\nRefused"), "error:connectionrefused");
        assert_eq!(normalize("ＡＰＩ　Ｋｅｙ"), "apikey");
        assert_eq!(normalize("截图 工具"), "截图工具");
    }

    #[test]
    fn entry_records_mean_confidence_and_engine_version() {
        let block = |confidence| OcrBlock {
            text: "x".into(),
            x: 0.0,
            y: 0.0,
            width: 1.0,
            height: 1.0,
            confidence,
        };
        let result = OcrResult {
            text: "Hello 世界".into(),
            language: "auto".into(),
            engine: "oar-ocr".into(),
            blocks: vec![block(0.5), block(1.0)],
        };
        let entry = OcrIndexEntry::new("screenshot_1.png".into(), &result);
        assert_eq!(entry.normalized, "hello世界");
        assert!((entry.confidence - 0.75).abs() < 1e-6);
        assert_eq!(entry.engine_version, format!("liteparse/{OAR_MODEL}"));
    }

    #[test]
    fn index_entries_are_named_after_the_screenshot() {
        let dir = Path::new("/data/ocr-index");
        assert_eq!(
            entry_path(dir, Path::new("/shots/images/screenshot_1.png")),
            Some(PathBuf::from("/data/ocr-index/screenshot_1.png.json"))
        );
    }
}
