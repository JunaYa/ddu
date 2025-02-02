#[cfg(target_os = "macos")]
pub mod mac;
#[cfg(target_os = "macos")]
pub use self::mac::*;

#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "linux")]
pub use self::linux::*;

#[cfg(target_os = "windows")]
pub mod windows;
#[cfg(target_os = "windows")]
pub use self::windows::*;
