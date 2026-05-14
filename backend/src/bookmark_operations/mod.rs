pub mod model;
pub mod service;

use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{de::Error as DeError, Deserialize, Deserializer, Serialize};
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use crate::utils::db::AppState;

// --- Bookmark ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bookmark {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,

    #[serde(rename = "type")]
    pub item_type: BookmarkType,

    pub url: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub favicon: Option<String>,
    pub og_image: Option<String>,
    pub domain: Option<String>,

    pub tags: Vec<String>,
    pub ai_summary: Option<String>,

    pub notes: Option<String>,
    pub is_favorite: bool,
    pub collection_id: Option<ObjectId>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub duplicate_links: Option<Vec<String>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding: Option<Vec<f64>>,

    #[serde(default = "default_status")]
    pub status: String,

    #[serde(deserialize_with = "deserialize_datetime_flexible")]
    pub created_at: DateTime<Utc>,
    #[serde(deserialize_with = "deserialize_datetime_flexible")]
    pub updated_at: DateTime<Utc>,
}

fn default_status() -> String {
    "ready".to_string()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum BookmarkType {
    Link,
    Note,
    Image,
}

// --- Request/Response Types ---

#[derive(Debug, Deserialize)]
pub struct CreateBookmarkRequest {
    pub url: Option<String>,
    pub title: Option<String>,
    #[serde(rename = "type", default = "default_type")]
    pub item_type: BookmarkType,
    pub notes: Option<String>,
}

fn default_type() -> BookmarkType {
    BookmarkType::Link
}

#[derive(Debug, Deserialize)]
pub struct UpdateBookmarkRequest {
    pub title: Option<String>,
    pub notes: Option<String>,
    pub duplicate_links: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub collection_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BookmarkQuery {
    pub page: Option<u64>,
    pub limit: Option<u64>,
    pub all: Option<bool>,
    pub collection_id: Option<String>,
    #[serde(rename = "type")]
    pub item_type: Option<String>,
    pub tags: Option<String>,
    pub domain: Option<String>,
    pub favorite: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct BookmarkListResponse {
    pub bookmarks: Vec<Bookmark>,
    pub total: u64,
    pub page: u64,
    pub limit: u64,
}

// --- Import Types ---

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportJob {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,
    pub job_id: String,
    pub total: u64,
    pub processed: i64,
    pub status: String,
    #[serde(deserialize_with = "deserialize_datetime_flexible")]
    pub created_at: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(default, deserialize_with = "deserialize_optional_datetime_flexible")]
    pub updated_at: Option<DateTime<Utc>>,
}

pub struct ParsedBookmark {
    pub url: String,
    pub title: String,
    pub timestamp: Option<i64>,
}

// --- Service Result Types ---

pub enum CreateBookmarkOutcome {
    Created { id: ObjectId, url: Option<String> },
    AlreadyExists { id: String, message: Option<&'static str> },
}

// --- DateTime Deserializers ---

pub(crate) fn deserialize_datetime_flexible<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = bson::Bson::deserialize(deserializer)?;

    match value {
        bson::Bson::DateTime(dt) => Ok(dt.to_chrono()),
        bson::Bson::String(s) => DateTime::parse_from_rfc3339(&s)
            .map(|dt| dt.with_timezone(&Utc))
            .map_err(DeError::custom),
        bson::Bson::Document(doc) => {
            if let Some(date_value) = doc.get("$date") {
                return match date_value {
                    bson::Bson::String(s) => DateTime::parse_from_rfc3339(s)
                        .map(|dt| dt.with_timezone(&Utc))
                        .map_err(DeError::custom),
                    bson::Bson::DateTime(dt) => Ok(dt.to_chrono()),
                    bson::Bson::Int64(ms) => Ok(bson::DateTime::from_millis(*ms).to_chrono()),
                    bson::Bson::Int32(ms) => Ok(bson::DateTime::from_millis(*ms as i64).to_chrono()),
                    _ => Err(DeError::custom("unsupported $date value type")),
                };
            }

            Err(DeError::custom(
                "invalid date document: expected BSON DateTime, RFC3339 string, or {$date: ...}",
            ))
        }
        _ => Err(DeError::custom(
            "invalid date type: expected BSON DateTime, RFC3339 string, or {$date: ...}",
        )),
    }
}

fn deserialize_optional_datetime_flexible<'de, D>(
    deserializer: D,
) -> Result<Option<DateTime<Utc>>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = Option::<bson::Bson>::deserialize(deserializer)?;

    match value {
        None | Some(bson::Bson::Null) => Ok(None),
        Some(value) => {
            let datetime = match value {
                bson::Bson::DateTime(dt) => dt.to_chrono(),
                bson::Bson::String(s) => DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .map_err(DeError::custom)?,
                bson::Bson::Document(doc) => {
                    if let Some(date_value) = doc.get("$date") {
                        match date_value {
                            bson::Bson::String(s) => DateTime::parse_from_rfc3339(s)
                                .map(|dt| dt.with_timezone(&Utc))
                                .map_err(DeError::custom)?,
                            bson::Bson::DateTime(dt) => dt.to_chrono(),
                            _ => return Err(DeError::custom("unsupported optional $date value type")),
                        }
                    } else {
                        return Err(DeError::custom("invalid optional date document"));
                    }
                }
                _ => return Err(DeError::custom("invalid optional date type")),
            };

            Ok(Some(datetime))
        }
    }
}

// --- Routes ---

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/bookmarks", get(model::list_bookmarks))
        .route("/bookmarks", post(model::create_bookmark))
        .route("/bookmarks/import", post(model::import_bookmarks))
        .route("/bookmarks/import/status/:job_id", get(model::import_status))
        .route("/bookmarks/reprocess-weak", post(model::reprocess_weak_bookmarks))
        .route("/bookmarks/:id", get(model::get_bookmark))
        .route("/bookmarks/:id", put(model::update_bookmark))
        .route("/bookmarks/:id", delete(model::delete_bookmark))
}
