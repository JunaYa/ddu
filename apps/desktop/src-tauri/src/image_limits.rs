use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, ImageReader};
use std::io::Cursor;

pub const MAX_IMAGE_BYTES: usize = 50 * 1024 * 1024;
const MAX_PIXELS: u64 = 40_000_000;
const MAX_DIMENSION: u32 = 40_000;

pub fn decode_base64(encoded: &str) -> Result<Vec<u8>, String> {
    if encoded.len() > MAX_IMAGE_BYTES.div_ceil(3) * 4 {
        return Err("encoded image is too large".into());
    }
    let bytes = general_purpose::STANDARD
        .decode(encoded)
        .map_err(|e| e.to_string())?;
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err("image is too large".into());
    }
    Ok(bytes)
}

pub fn decode_image(bytes: &[u8]) -> Result<DynamicImage, String> {
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err("image is too large".into());
    }
    let reader = || {
        let mut reader = ImageReader::new(Cursor::new(bytes))
            .with_guessed_format()
            .map_err(|e| e.to_string())?;
        let mut limits = image::Limits::default();
        limits.max_image_width = Some(MAX_DIMENSION);
        limits.max_image_height = Some(MAX_DIMENSION);
        limits.max_alloc = Some(256 * 1024 * 1024);
        reader.limits(limits);
        Ok::<_, String>(reader)
    };
    let (w, h) = reader()?.into_dimensions().map_err(|e| e.to_string())?;
    validate_dimensions(w, h)?;
    reader()?.decode().map_err(|e| e.to_string())
}

fn validate_dimensions(w: u32, h: u32) -> Result<(), String> {
    if w == 0
        || h == 0
        || w > MAX_DIMENSION
        || h > MAX_DIMENSION
        || u64::from(w) * u64::from(h) > MAX_PIXELS
    {
        return Err("image dimensions exceed the supported limits".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_large_payload_before_decoding() {
        assert!(
            decode_base64(&"!".repeat(MAX_IMAGE_BYTES.div_ceil(3) * 4 + 1))
                .unwrap_err()
                .contains("too large")
        );
        assert!(decode_base64("not base64").is_err());
    }
    #[test]
    fn permits_screenshots_but_rejects_pixel_bombs() {
        assert!(validate_dimensions(3840, 2160).is_ok());
        assert!(validate_dimensions(1000, 40000).is_ok());
        assert!(validate_dimensions(16384, 16384).is_err());
        assert!(validate_dimensions(u32::MAX, u32::MAX).is_err());
        let mut png = Cursor::new(Vec::new());
        DynamicImage::new_rgba8(2, 2)
            .write_to(&mut png, image::ImageFormat::Png)
            .unwrap();
        assert_eq!(decode_image(&png.into_inner()).unwrap().width(), 2);
        assert!(decode_image(b"not an image").is_err());
    }
}
