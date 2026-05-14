use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub mongodb_uri: String,
    pub database_name: String,
    pub gemini_api_keys: Vec<String>,
    pub jwt_secret: String,
    pub port: u16,
    pub cors_origin: String,
    pub search_min_score: Option<f64>,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        // Read multiple Gemini API keys (GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...)
        let mut gemini_api_keys = Vec::new();
        for i in 1..=5 {
            let key_name = format!("GEMINI_API_KEY_{}", i);
            if let Ok(key) = env::var(&key_name) {
                if !key.is_empty() {
                    gemini_api_keys.push(key);
                }
            }
        }
        // Fallback to legacy single key for backwards compatibility
        if gemini_api_keys.is_empty() {
            if let Ok(key) = env::var("GEMINI_API_KEY") {
                if !key.is_empty() {
                    gemini_api_keys.push(key);
                }
            }
        }

        Ok(Config {
            mongodb_uri: env::var("MONGODB_URI")
                .unwrap_or_else(|_| "mongodb://localhost:27017".to_string()),
            database_name: env::var("DATABASE_NAME")
                .unwrap_or_else(|_| "Bookmarkvault".to_string()),
            gemini_api_keys,
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "dev-secret-change-me".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            cors_origin: env::var("CORS_ORIGIN")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            search_min_score: env::var("SEARCH_MIN_SCORE")
                .ok()
                .and_then(|v| v.parse::<f64>().ok())
                .map(|v| v.clamp(0.0, 1.0)),
        })
    }
}
