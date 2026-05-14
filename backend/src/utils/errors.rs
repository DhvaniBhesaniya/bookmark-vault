use axum::{http::StatusCode, response::IntoResponse, Json};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),

    #[error(transparent)]
    MongoDB(#[from] mongodb::error::Error),

    #[error(transparent)]
    BsonOid(#[from] bson::oid::Error),

    #[error(transparent)]
    Bcrypt(#[from] bcrypt::BcryptError),

    #[error(transparent)]
    Jwt(#[from] jsonwebtoken::errors::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let (status, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
            AppError::Anyhow(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::MongoDB(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::BsonOid(e) => (StatusCode::BAD_REQUEST, e.to_string()),
            AppError::Bcrypt(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            AppError::Jwt(e) => (StatusCode::UNAUTHORIZED, e.to_string()),
        };

        tracing::error!("Error {}: {}", status, message);

        (
            status,
            Json(json!({ "error": status.as_str(), "message": message })),
        )
            .into_response()
    }
}
