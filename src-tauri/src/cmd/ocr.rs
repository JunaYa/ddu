use std::path::Path;
use std::process::Command;
use serde::{Deserialize, Serialize};
use tracing::info;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    pub text: String,
    pub language: String,
    pub engine: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SensitiveFinding {
    pub finding_type: String,
    pub text_preview: String,
    pub confidence: f32,
    pub suggested_action: String,
}

#[tauri::command]
pub async fn perform_ocr(path: String) -> Result<OcrResult, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("File not found".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        let text = macos_ocr(&path)?;
        info!("OCR extracted {} characters", text.len());
        Ok(OcrResult {
            text,
            language: "auto".to_string(),
            engine: "system".to_string(),
        })
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err("OCR not available on this platform yet".to_string())
    }
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

    let email_re = regex_lite::Regex::new(r#"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"#).unwrap();
    for m in email_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "email".to_string(),
            text_preview: m.as_str().to_string(),
            confidence: 0.95,
            suggested_action: "pixelate".to_string(),
        });
    }

    let phone_re = regex_lite::Regex::new(r#"\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"#).unwrap();
    for m in phone_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "phone".to_string(),
            text_preview: m.as_str().to_string(),
            confidence: 0.85,
            suggested_action: "pixelate".to_string(),
        });
    }

    let api_key_re = regex_lite::Regex::new(r#"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['"]?[\w\-./+]{16,}"#).unwrap();
    for m in api_key_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "apiKey".to_string(),
            text_preview: m.as_str()[..m.as_str().len().min(30)].to_string() + "...",
            confidence: 0.90,
            suggested_action: "solidFill".to_string(),
        });
    }

    let jwt_re = regex_lite::Regex::new(r#"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}"#).unwrap();
    for m in jwt_re.find_iter(&text) {
        findings.push(SensitiveFinding {
            finding_type: "jwt".to_string(),
            text_preview: m.as_str()[..m.as_str().len().min(30)].to_string() + "...",
            confidence: 0.95,
            suggested_action: "solidFill".to_string(),
        });
    }

    let ip_re = regex_lite::Regex::new(r#"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"#).unwrap();
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
