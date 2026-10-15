use tauri::ipc::Origin;

#[test]
fn compiled_acl_enforces_window_boundaries() {
    let manifests: serde_json::Value =
        serde_json::from_str(include_str!("../gen/schemas/acl-manifests.json")).unwrap();
    assert!(
        manifests.get("__app-acl__").is_some(),
        "without an app manifest local commands bypass ACL"
    );
    let mut context: tauri::Context<tauri::Wry> = tauri::generate_context!();
    let acl = context.runtime_authority_mut();
    for (window, command) in [
        ("setting", "read_setting"),
        ("setting", "write_setting"),
        ("setting", "choose_screenshot_directory"),
        ("setting", "start_recording"),
        ("main", "open_image_for_ocr"),
        ("main", "get_image_base64"),
        ("preview", "take_imported_image"),
        ("preview", "save_annotated_image"),
        ("capture-2", "smart_capture_finalize"),
        ("permission", "permission_drag_app"),
        ("startup", "permission_status"),
        ("setting", "plugin:dialog|message"),
    ] {
        assert!(
            acl.resolve_access(command, window, window, &Origin::Local)
                .is_some(),
            "{window}: {command}"
        );
    }
    for window in [
        "main",
        "preview",
        "setting",
        "startup",
        "capture",
        "capture-2",
        "permission",
    ] {
        for command in [
            "convert_to_gif",
            "plugin:store|load",
            "plugin:store|set",
            "plugin:store|save",
            "plugin:fs|read_file",
            "plugin:fs|write_file",
            "plugin:shell|open",
            "plugin:event|emit",
            "plugin:event|emit_to",
            "execute_workflow",
        ] {
            assert!(
                acl.resolve_access(command, window, window, &Origin::Local)
                    .is_none(),
                "{window}: {command}"
            );
        }
        if window != "setting" {
            for command in [
                "write_setting",
                "choose_screenshot_directory",
                "start_recording",
            ] {
                assert!(
                    acl.resolve_access(command, window, window, &Origin::Local)
                        .is_none(),
                    "{window}: {command}"
                );
            }
        }
        if window != "preview" {
            assert!(acl
                .resolve_access("save_annotated_image", window, window, &Origin::Local)
                .is_none());
        }
    }
}
