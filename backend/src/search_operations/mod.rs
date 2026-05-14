pub mod model;
pub mod service;

use serde::Deserialize;
use axum::{routing::get, Router};
use crate::utils::db::AppState;

// --- Structs ---

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: String,
    pub limit: Option<i64>,
    pub min_score: Option<f64>,
    pub collection_id: Option<String>,
}

// --- Routes ---

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/search", get(model::semantic_search))
        .route("/search/tags", get(model::get_tags))
}
