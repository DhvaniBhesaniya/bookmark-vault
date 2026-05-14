pub mod model;
pub mod service;

use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use crate::utils::db::AppState;

// --- Structs ---

#[derive(Debug, Serialize, Deserialize)]
pub struct BookmarkCollection {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,
    pub name: String,
    pub color: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCollectionRequest {
    pub name: String,
    pub color: Option<String>,
}

// --- Routes ---

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/collections", get(model::list_collections))
        .route("/collections", post(model::create_collection))
        .route("/collections/:id", put(model::update_collection))
        .route("/collections/:id", delete(model::delete_collection))
}
