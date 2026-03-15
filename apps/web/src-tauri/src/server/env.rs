use std::env as std_env;
use std::path::PathBuf;

pub struct EnvVars {
    pub better_auth_secret: String,
    pub better_auth_url: String,
    pub cors_origin: String,
    pub google_client_id: Option<String>,
    pub google_client_secret: Option<String>,
    pub dropbox_client_id: Option<String>,
    pub dropbox_client_secret: Option<String>,
}

const BETTER_AUTH_SECRET_CT: Option<&'static str> = option_env!("BETTER_AUTH_SECRET");
const BETTER_AUTH_URL_CT: Option<&'static str> = option_env!("BETTER_AUTH_URL");
const CORS_ORIGIN_CT: Option<&'static str> = option_env!("CORS_ORIGIN");
const GOOGLE_CLIENT_ID_CT: Option<&'static str> = option_env!("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET_CT: Option<&'static str> = option_env!("GOOGLE_CLIENT_SECRET");
const DROPBOX_CLIENT_ID_CT: Option<&'static str> = option_env!("DROPBOX_CLIENT_ID");
const DROPBOX_CLIENT_SECRET_CT: Option<&'static str> = option_env!("DROPBOX_CLIENT_SECRET");

impl EnvVars {
    pub fn from_env() -> Result<Self, String> {
        Ok(Self {
            better_auth_secret: get_env_or_compile_time(
                "BETTER_AUTH_SECRET",
                BETTER_AUTH_SECRET_CT,
            )?,
            better_auth_url: get_env_or_compile_time("BETTER_AUTH_URL", BETTER_AUTH_URL_CT)?,
            cors_origin: get_env_or_compile_time("CORS_ORIGIN", CORS_ORIGIN_CT)?,
            google_client_id: get_optional_env_or_compile_time("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID_CT),
            google_client_secret: get_optional_env_or_compile_time(
                "GOOGLE_CLIENT_SECRET",
                GOOGLE_CLIENT_SECRET_CT,
            ),
            dropbox_client_id: get_optional_env_or_compile_time(
                "DROPBOX_CLIENT_ID",
                DROPBOX_CLIENT_ID_CT,
            ),
            dropbox_client_secret: get_optional_env_or_compile_time(
                "DROPBOX_CLIENT_SECRET",
                DROPBOX_CLIENT_SECRET_CT,
            ),
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
        google_client_id: get_optional_env_or_compile_time("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID_CT),
        google_client_secret: get_optional_env_or_compile_time(
            "GOOGLE_CLIENT_SECRET",
            GOOGLE_CLIENT_SECRET_CT,
        ),
        dropbox_client_id: get_optional_env_or_compile_time(
            "DROPBOX_CLIENT_ID",
            DROPBOX_CLIENT_ID_CT,
        ),
        dropbox_client_secret: get_optional_env_or_compile_time(
            "DROPBOX_CLIENT_SECRET",
            DROPBOX_CLIENT_SECRET_CT,
        ),
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

fn get_optional_env_or_compile_time(key: &str, compile_time: Option<&'static str>) -> Option<String> {
    if let Ok(value) = std_env::var(key) {
        if !value.trim().is_empty() {
            return Some(value);
        }
    }

    compile_time
        .map(|value| value.to_string())
        .filter(|value| !value.trim().is_empty())
}
