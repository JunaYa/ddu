//! Private OCR cache storage. Symlinks are never followed when repairing old entries.
use std::{
    fs,
    io::Write,
    path::Path,
    sync::atomic::{AtomicU64, Ordering},
};
static SEQUENCE: AtomicU64 = AtomicU64::new(0);

pub fn prepare_directory(dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let meta = fs::symlink_metadata(dir).map_err(|e| e.to_string())?;
    if !meta.is_dir() || meta.file_type().is_symlink() {
        return Err("invalid private directory".into());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
        fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).map_err(|e| e.to_string())?;
        for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if !entry.file_type().map_err(|e| e.to_string())?.is_file() {
                continue;
            }
            let file = fs::OpenOptions::new()
                .read(true)
                .custom_flags(libc::O_NOFOLLOW)
                .open(entry.path())
                .map_err(|e| e.to_string())?;
            file.set_permissions(fs::Permissions::from_mode(0o600))
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path.parent().ok_or("missing parent")?;
    let temp = parent.join(format!(
        ".index-{}-{}",
        std::process::id(),
        SEQUENCE.fetch_add(1, Ordering::Relaxed)
    ));
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&temp).map_err(|e| e.to_string())?;
    let result = (|| {
        file.write_all(bytes)?;
        file.sync_all()?;
        fs::rename(&temp, path)
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temp);
    }
    result.map_err(|e| e.to_string())
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::{symlink, PermissionsExt};
    #[test]
    fn migrates_old_permissions_and_replaces_without_following_links() {
        let dir = std::env::temp_dir().join(format!(
            "ddu-index-{}-{}",
            std::process::id(),
            SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&dir).unwrap();
        let entry = dir.join("entry.json");
        fs::write(&entry, b"old").unwrap();
        fs::set_permissions(&entry, fs::Permissions::from_mode(0o644)).unwrap();
        prepare_directory(&dir).unwrap();
        assert_eq!(
            fs::metadata(&dir).unwrap().permissions().mode() & 0o777,
            0o700
        );
        assert_eq!(
            fs::metadata(&entry).unwrap().permissions().mode() & 0o777,
            0o600
        );
        atomic_write(&entry, b"new").unwrap();
        assert_eq!(fs::read(&entry).unwrap(), b"new");
        let link = dir.join("link.json");
        symlink(&entry, &link).unwrap();
        atomic_write(&link, b"replacement").unwrap();
        assert_eq!(fs::read(&entry).unwrap(), b"new");
        assert_eq!(
            fs::metadata(&link).unwrap().permissions().mode() & 0o777,
            0o600
        );
        let dir_link = dir.join("directory-link");
        symlink(&dir, &dir_link).unwrap();
        assert!(prepare_directory(&dir_link).is_err());
        fs::remove_dir_all(dir).unwrap();
    }
}
