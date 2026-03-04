use std::env as std_env;
use std::path::PathBuf;

pub struct EnvVars {
    pub better_auth_secret: String,
    pub better_auth_url: String,
    pub cors_origin: String,
}

const BETTER_AUTH_SECRET_CT: Option<&'static str> = option_env!("BETTER_AUTH_SECRET");
const BETTER_AUTH_URL_CT: Option<&'static str> = option_env!("BETTER_AUTH_URL");
const CORS_ORIGIN_CT: Option<&'static str> = option_env!("CORS_ORIGIN");

impl EnvVars {
    pub fn from_env() -> Result<Self, String> {
        Ok(Self {
            better_auth_secret: get_env_or_compile_time(
                "BETTER_AUTH_SECRET",
                BETTER_AUTH_SECRET_CT,
            )?,
            better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)?,
            cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)?,
        })
    }
}

pub fn load_dotenv_files() -> EnvVars {
    dotenv::dotenv().ok();

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let web_env = manifest_dir.join(".env");
    let server_env = manifest_dir
        .join("..")
        .join("..")
        .join("server")
        .join(".env");

    if web_env.exists() {
        log::info!("Loading .env from: {:?}", web_env);
        let _ = dotenv::from_path(&web_env);
    }

    if server_env.exists() {
        log::info!("Loading .env from: {:?}", server_env);
        let _ = dotenv::from_path(&server_env);
    }

    EnvVars {
        better_auth_secret: get_env_or_compile_time("BETTER_AUTH_SECRET", BETTER_AUTH_SECRET_CT)
            .expect("BETTER_AUTH_SECRET environment variable must be set"),
        better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)
            .expect("BETTER_AUTH_URL environment variable must be set"),
        cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)
            .expect("CORS_ORIGIN environment variable must be set"),
    }
}

fn get_env_or_compile_time(
    key: &str,
    compile_time: Option<&'static str>,
) -> Result<String, String> {
    if let Ok(value) = std_env::var(key) {
        return Ok(value);
    }

    if let Some(value) = compile_time {
        return Ok(value.to_string());
    }

    Err(format!("{key} not set"))
}
