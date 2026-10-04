// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[allow(unused_imports)]
use tauri::Manager;

#[tauri::command]
fn get_system_info() -> String {
    format!("Windows Spatial Canvas Host - Tauri v2 (x86_64)")
}

#[tauri::command]
fn convert_local_path_to_stream(path: String) -> Result<String, String> {
    if std::path::Path::new(&path).exists() {
        // Return streaming protocol or validated path
        Ok(path)
    } else {
        Err("File not found".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            convert_local_path_to_stream
        ])
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Spatial Canvas desktop application");
}
