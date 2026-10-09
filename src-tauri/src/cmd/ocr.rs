use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::{Arc, Mutex};
use liteparse::ocr::oar::OarOcrEngine;
use liteparse::{LiteParse, LiteParseConfig};
use serde::{Deserialize, Serialize};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tracing::{info, warn};

use crate::common::ensure_within_images_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    pub text: String,
    pub language: String,
    pub engine: String,
    /// Recognized text regions in screenshot pixel coordinates. Empty for
    /// engines that only return plain text (the macOS Vision fallback).
    pub blocks: Vec<OcrBlock>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrBlock {
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensitiveFinding {
    pub finding_type: String,
    pub text_preview: String,
    pub confidence: f32,
    pub suggested_action: String,
}

/// Loaded once and reused: building the ONNX sessions costs far more than a
/// single recognition, and the first build also downloads the models.
static OAR_ENGINE: Mutex<Option<Arc<OarOcrEngine>>> = Mutex::new(None);

/// Area of the screenshot to recognize, in image pixels.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct OcrRegion {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

/// Smaller crops carry too few pixels for a glyph to be recognized.
const MIN_OCR_SIDE: u32 = 8;

#[tauri::command]
pub async fn perform_ocr(
    app_handle: tauri::AppHandle,
    path: String,
    region: Option<OcrRegion>,
) -> Result<OcrResult, String> {
    let guarded = ensure_within_images_dir(&app_handle, Path::new(&path))?;
    if !guarded.exists() {
        return Err("File not found".to_string());
    }

    let crop = match region {
        Some(region) => Some(CroppedImage::new(&guarded, region)?),
        None => None,
    };
    let source = crop
        .as_ref()
        .map_or(guarded.to_string_lossy().to_string(), |c| c.path.to_string_lossy().to_string());

    let mut result = match oar_ocr(&source).await {
        Ok(result) => result,
        #[cfg(target_os = "macos")]
        Err(err) => {
            warn!("oar-ocr failed, falling back to macOS Vision: {err}");
            OcrResult {
                text: macos_ocr(&source)?,
                language: "auto".to_string(),
                engine: "system".to_string(),
                blocks: Vec::new(),
            }
        }
        #[cfg(not(target_os = "macos"))]
        Err(err) => return Err(err),
    };

    // Report boxes against the full screenshot, not the temporary crop.
    if let Some(crop) = &crop {
        for block in &mut result.blocks {
            block.x += crop.region.x as f32;
            block.y += crop.region.y as f32;
        }
    }

    info!("OCR extracted {} characters", result.text.len());
    Ok(result)
}

#[tauri::command]
pub fn copy_text(app_handle: tauri::AppHandle, text: String) -> Result<(), String> {
    app_handle
        .clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

/// A region of a screenshot written to a temp PNG, removed on drop.
struct CroppedImage {
    path: PathBuf,
    region: OcrRegion,
}

impl CroppedImage {
    fn new(source: &Path, region: OcrRegion) -> Result<Self, String> {
        let img = image::open(source).map_err(|e| format!("Failed to read image: {e}"))?;
        let (img_w, img_h) = (img.width(), img.height());
        let x = region.x.min(img_w);
        let y = region.y.min(img_h);
        let region = OcrRegion {
            x,
            y,
            width: region.width.min(img_w - x),
            height: region.height.min(img_h - y),
        };
        if region.width < MIN_OCR_SIDE || region.height < MIN_OCR_SIDE {
            return Err("Selection is too small to recognize text".to_string());
        }

        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or_default();
        let path = std::env::temp_dir().join(format!("ddu-ocr-{}-{nanos}.png", std::process::id()));
        img.crop_imm(region.x, region.y, region.width, region.height)
            .save(&path)
            .map_err(|e| format!("Failed to prepare selection: {e}"))?;
        Ok(Self { path, region })
    }
}

impl Drop for CroppedImage {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.path);
    }
}

fn oar_engine() -> Result<Arc<OarOcrEngine>, String> {
    let mut slot = OAR_ENGINE
        .lock()
        .map_err(|_| "OCR engine lock poisoned".to_string())?;
    if let Some(engine) = slot.as_ref() {
        return Ok(engine.clone());
    }
    // PP-OCRv6 small covers Chinese, English, Japanese and Latin scripts in
    // one model; models are fetched to $OAR_HOME (~/.oar) on first use.
    let engine = Arc::new(
        OarOcrEngine::ppocr_v6_small().map_err(|e| format!("Failed to load OCR models: {e}"))?,
    );
    *slot = Some(engine.clone());
    Ok(engine)
}

async fn oar_ocr(path: &str) -> Result<OcrResult, String> {
    let engine = tauri::async_runtime::spawn_blocking(oar_engine)
        .await
        .map_err(|e| format!("OCR engine task failed: {e}"))??;

    let config = LiteParseConfig {
        ocr_enabled: true,
        // Recognition language is fixed by the model; an empty code also
        // keeps oar-ocr from warning that it ignores the default "eng".
        ocr_language: String::new(),
        quiet: true,
        num_workers: 1,
        ..Default::default()
    };
    // liteparse panics (rather than erroring) when PDFium can't be loaded;
    // run it in its own task so that surfaces as an error and the caller can
    // fall back.
    let owned_path = path.to_string();
    let parsed = tauri::async_runtime::spawn(async move {
        LiteParse::new(config)
            .with_ocr_engine(engine)
            .parse(&owned_path)
            .await
    })
    .await
    .map_err(|e| format!("OCR engine crashed: {e}"))?
    .map_err(|e| format!("OCR failed: {e}"))?;

    // LiteParse lays the image out on a PDF page in 72-DPI points; scale the
    // item boxes back to the screenshot's pixel grid.
    let (img_w, img_h) =
        image::image_dimensions(path).map_err(|e| format!("Failed to read image: {e}"))?;
    let blocks = parsed
        .pages
        .first()
        .map(|page| {
            let sx = img_w as f32 / page.page_width;
            let sy = img_h as f32 / page.page_height;
            page.text_items
                .iter()
                .filter(|item| !item.text.trim().is_empty())
                .map(|item| OcrBlock {
                    text: item.text.clone(),
                    x: item.x * sx,
                    y: item.y * sy,
                    width: item.width * sx,
                    height: item.height * sy,
                    confidence: item.confidence.unwrap_or(1.0),
                })
                .collect()
        })
        .unwrap_or_default();

    Ok(OcrResult {
        text: parsed.text.trim().to_string(),
        language: "auto".to_string(),
        engine: "oar-ocr".to_string(),
        blocks,
    })
}

#[cfg(target_os = "macos")]
fn macos_ocr(image_path: &str) -> Result<String, String> {
    let script = format!(
        r#"
use framework "Vision"
use framework "AppKit"
use scripting additions

set imagePath to "{}"
set theImage to current application's NSImage's alloc()'s initWithContentsOfFile:imagePath
if theImage is missing value then
    return "ERROR: Could not load image"
end if

set requestHandler to current application's VNImageRequestHandler's alloc()'s initWithData:(theImage's TIFFRepresentation()) options:(current application's NSDictionary's dictionary())
set ocrRequest to current application's VNRecognizeTextRequest's alloc()'s init()
ocrRequest's setRecognitionLevel:(current application's VNRequestTextRecognitionLevelAccurate)
ocrRequest's setRecognitionLanguages:{{"en", "zh-Hans", "zh-Hant", "ja", "ko"}}

requestHandler's performRequests:{{ocrRequest}} |error|:(missing value)

set theResults to ocrRequest's results()
set resultText to ""
repeat with observation in theResults
    set topCandidate to (observation's topCandidates:1)'s firstObject()
    if topCandidate is not missing value then
        set resultText to resultText & (topCandidate's |string|() as text) & linefeed
    end if
end repeat

return resultText
"#,
        image_path.replace('"', "\\\"")
    );

    let output = Command::new("osascript")
        .args(["-l", "AppleScript", "-e", &script])
        .output()
        .map_err(|e| format!("Failed to run OCR: {}", e))?;

    if output.status.success() {
        let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if text.starts_with("ERROR:") {
            return Err(text);
        }
        Ok(text)
    } else {
        let err = String::from_utf8_lossy(&output.stderr);
        Err(format!("OCR failed: {}", err))
    }
}

#[tauri::command]
pub fn detect_sensitive_info(text: String) -> Vec<SensitiveFinding> {
    let mut findings = Vec::new();

    let email_re = regex_lite::Regex::new(r#"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"#)
        .expect("static email regex is valid");
    for m in email_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "email".to_string(),
            text_preview: m.as_str().to_string(),
            confidence: 0.95,
            suggested_action: "pixelate".to_string(),
        });
    }

    let phone_re = regex_lite::Regex::new(r#"\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"#)
        .expect("static phone regex is valid");
    for m in phone_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "phone".to_string(),
            text_preview: m.as_str().to_string(),
            confidence: 0.85,
            suggested_action: "pixelate".to_string(),
        });
    }

    let api_key_re = regex_lite::Regex::new(r#"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[\w\-./+]{16,}"#)
        .expect("static api-key regex is valid");
    for m in api_key_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "apiKey".to_string(),
            text_preview: m.as_str()[..m.as_str().len().min(30)].to_string() + "...",
            confidence: 0.90,
            suggested_action: "solidFill".to_string(),
        });
    }

    let jwt_re = regex_lite::Regex::new(r#"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}"#)
        .expect("static jwt regex is valid");
    for m in jwt_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "jwt".to_string(),
            text_preview: m.as_str()[..m.as_str().len().min(30)].to_string() + "...",
            confidence: 0.95,
            suggested_action: "solidFill".to_string(),
        });
    }

    let ip_re = regex_lite::Regex::new(r#"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"#)
        .expect("static ip regex is valid");
    for m in ip_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "ipAddress".to_string(),
            text_preview: m.as_str().to_string(),
            confidence: 0.80,
            suggested_action: "pixelate".to_string(),
        });
    }

    findings
}

#[cfg(test)]
mod tests {
    use super::*;

    fn blank_png(name: &str, w: u32, h: u32) -> PathBuf {
        let path = std::env::temp_dir().join(format!("ddu-ocr-test-{}-{name}.png", std::process::id()));
        image::RgbImage::new(w, h).save(&path).unwrap();
        path
    }

    #[test]
    fn crop_clamps_region_to_image_and_cleans_up() {
        let src = blank_png("clamp", 100, 50);
        let crop = CroppedImage::new(&src, OcrRegion { x: 80, y: 10, width: 500, height: 500 }).unwrap();
        assert_eq!((crop.region.x, crop.region.y), (80, 10));
        assert_eq!((crop.region.width, crop.region.height), (20, 40));
        assert_eq!(image::image_dimensions(&crop.path).unwrap(), (20, 40));
        let tmp = crop.path.clone();
        drop(crop);
        assert!(!tmp.exists());
        std::fs::remove_file(src).unwrap();
    }

    #[test]
    fn crop_rejects_tiny_or_out_of_bounds_selection() {
        let src = blank_png("tiny", 100, 50);
        assert!(CroppedImage::new(&src, OcrRegion { x: 0, y: 0, width: 4, height: 40 }).is_err());
        assert!(CroppedImage::new(&src, OcrRegion { x: 200, y: 0, width: 50, height: 40 }).is_err());
        std::fs::remove_file(src).unwrap();
    }

    /// Runs the real oar-ocr pipeline (downloads models on first run):
    /// `DDU_OCR_SAMPLE=/path/to.png cargo test oar_ocr_reads_sample -- --ignored --nocapture`
    #[test]
    #[ignore]
    fn oar_ocr_reads_sample() {
        let path = std::env::var("DDU_OCR_SAMPLE").expect("set DDU_OCR_SAMPLE");
        let result = tauri::async_runtime::block_on(oar_ocr(&path)).unwrap();
        println!("{}", serde_json::to_string_pretty(&result).unwrap());
        assert_eq!(result.engine, "oar-ocr");
        assert!(!result.text.is_empty());
        assert!(!result.blocks.is_empty());

        // Recognizing a crop of the first block should find that block's text.
        let first = &result.blocks[0];
        let region = OcrRegion {
            x: first.x as u32,
            y: first.y as u32,
            width: first.width.ceil() as u32,
            height: first.height.ceil() as u32,
        };
        let crop = CroppedImage::new(Path::new(&path), region).unwrap();
        let cropped = tauri::async_runtime::block_on(oar_ocr(&crop.path.to_string_lossy())).unwrap();
        println!("crop: {}", cropped.text);
        assert_eq!(cropped.text, first.text);
    }
}
