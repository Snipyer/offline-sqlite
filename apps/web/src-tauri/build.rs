use std::env;
use std::path::PathBuf;

fn main() {
  let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
  let web_env = manifest_dir.join(".env");
  let server_env = manifest_dir.join("..").join("..").join("server").join(".env");

  println!("cargo:rerun-if-changed={}", web_env.display());
  println!("cargo:rerun-if-changed={}", server_env.display());

  if web_env.exists() {
    let _ = dotenv::from_path(&web_env);
  }

  if server_env.exists() {
    let _ = dotenv::from_path(&server_env);
  }

  for key in ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "CORS_ORIGIN"] {
    if let Ok(value) = env::var(key) {
      println!("cargo:rustc-env={key}={value}");
    }
  }

  tauri_build::build()
}
