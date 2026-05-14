use crate::utils::config::Config;
use crate::utils::gemini::GeminiClient;
use mongodb::{
    options::IndexOptions,
    Client,
    Collection,
    Database,
    IndexModel,
};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub gemini: GeminiClient,
}

impl AppState {
    pub async fn new(config: Config) -> anyhow::Result<Self> {
        let client = Client::with_uri_str(&config.mongodb_uri).await?;
        let db = client.database(&config.database_name);

        // Verify connection
        db.run_command(bson::doc! { "ping": 1 }).await?;
        tracing::info!("Connected to MongoDB: {}", config.database_name);

        ensure_indexes(&db).await?;

        // Initialize GeminiClient with fallback models
        let text_models = vec![
            "gemini-3.1-flash-lite".to_string(),
            "gemini-2.5-flash-lite".to_string(),
            "gemini-2.5-flash".to_string(),
            "gemini-3.0-flash".to_string(),
            "gemini-1.5-flash".to_string(),
        ];

        let embedding_models = vec![
            "gemini-embedding-001".to_string(),
            "text-embedding-004".to_string(),
        ];

        let gemini = GeminiClient::new(
            config.gemini_api_keys.clone(),
            text_models,
            embedding_models,
        );

        Ok(AppState { db, config, gemini })
    }

    pub fn collection<T>(&self, name: &str) -> Collection<T>
    where
        T: Send + Sync,
    {
        self.db.collection(name)
    }
}

async fn ensure_indexes(db: &Database) -> anyhow::Result<()> {
    // --- bookmarks: full-text search index ---
    let bookmarks = db.collection::<bson::Document>("bookmarks");

    let text_index = IndexModel::builder()
        .keys(bson::doc! {
            "title": "text",
            "description": "text",
            "ai_summary": "text",
            "tags": "text"
        })
        .options(
            IndexOptions::builder()
                .name(Some("bookmark_text_search_idx".to_string()))
                .build(),
        )
        .build();

    bookmarks.create_index(text_index).await?;
    tracing::info!("Ensured text index on bookmarks");

    // --- import_jobs: TTL index (auto-delete after 1 hour) ---
    let import_jobs = db.collection::<bson::Document>("import_jobs");

    let ttl_index = IndexModel::builder()
        .keys(bson::doc! { "created_at": 1 })
        .options(
            IndexOptions::builder()
                .name(Some("import_jobs_ttl".to_string()))
                .expire_after(Some(std::time::Duration::from_secs(3600)))
                .build(),
        )
        .build();

    import_jobs.create_index(ttl_index).await?;
    tracing::info!("Ensured TTL index on import_jobs (1 hour)");

    Ok(())
}
