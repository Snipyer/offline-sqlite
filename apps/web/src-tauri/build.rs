use std::env;
use std::path::PathBuf;

fn main() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let app_dir = manifest_dir.join("..");
    let web_env = app_dir.join(".env");
    let web_env_production = app_dir.join(".env.production");
    let server_env = manifest_dir
        .join("..")
        .join("..")
        .join("server")
        .join(".env");
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());

    println!("cargo:rerun-if-changed={}", web_env.display());
    println!("cargo:rerun-if-changed={}", web_env_production.display());
    println!("cargo:rerun-if-changed={}", server_env.display());

    if web_env.exists() {
        let _ = dotenv::from_path(&web_env);
    }

    if profile == "release" && web_env_production.exists() {
        let _ = dotenv::from_path(&web_env_production);
    }

    if server_env.exists() {
        let _ = dotenv::from_path(&server_env);
    }

    for key in [
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "CORS_ORIGIN",
        "LICENSE_SERVER_URL",
    ] {
        if let Ok(value) = env::var(key) {
            println!("cargo:rustc-env={key}={value}");
        }
    }

    tauri_build::build()
}
