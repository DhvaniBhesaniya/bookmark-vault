use axum::{
    extract::{State, Path, Query, Multipart},
    http::StatusCode,
    response::{Response, IntoResponse},
    Extension, Json,
};
use bson::oid::ObjectId;
use serde_json::json;
use crate::utils::{db::AppState, errors::AppError};
use super::{
    service, BookmarkQuery,
    CreateBookmarkOutcome, CreateBookmarkRequest, UpdateBookmarkRequest,
};

/// GET /api/v1/bookmarks
pub async fn list_bookmarks(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Query(query): Query<BookmarkQuery>,
) -> Result<Response, AppError> {
    let response = service::list_bookmarks(&state, user_id, query).await?;
    Ok(Json(response).into_response())
}

/// POST /api/v1/bookmarks
pub async fn create_bookmark(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Json(body): Json<CreateBookmarkRequest>,
) -> Result<Response, AppError> {
    let outcome = service::create_bookmark(&state, user_id, body).await?;

    match outcome {
        CreateBookmarkOutcome::Created { id, url } => {
            // Spawn background task for AI processing
            let bg_state = state.clone();
            let bg_url = url.clone();
            tokio::spawn(async move {
                if let Err(e) = service::process_bookmark(&bg_state, id, bg_url).await {
                    tracing::error!("Background processing failed for {}: {}", id, e);
                }
            });

            Ok((StatusCode::CREATED, Json(json!({
                "id": id.to_hex(),
                "url": url,
                "title": "Processing...",
                "status": "processing"
            }))).into_response())
        }
        CreateBookmarkOutcome::AlreadyExists { id, message } => {
            Ok((StatusCode::OK, Json(json!({
                "id": id,
                "status": "already_exists",
                "message": message.unwrap_or("Already exists")
            }))).into_response())
        }
    }
}

/// GET /api/v1/bookmarks/:id
pub async fn get_bookmark(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    let bookmark = service::get_bookmark(&state, user_id, &id).await?;
    Ok(Json(bookmark).into_response())
}

/// PUT /api/v1/bookmarks/:id
pub async fn update_bookmark(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
    Json(body): Json<UpdateBookmarkRequest>,
) -> Result<Response, AppError> {
    service::update_bookmark(&state, user_id, &id, body).await?;
    Ok(Json(json!({ "updated": true })).into_response())
}

/// DELETE /api/v1/bookmarks/:id
pub async fn delete_bookmark(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    service::delete_bookmark(&state, user_id, &id).await?;
    Ok(StatusCode::NO_CONTENT.into_response())
}

/// POST /api/v1/bookmarks/import
pub async fn import_bookmarks(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    mut multipart: Multipart,
) -> Result<Response, AppError> {
    let mut html_content = String::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| AppError::BadRequest(e.to_string()))? {
        if field.name() == Some("file") {
            let bytes = field.bytes().await.map_err(|e| AppError::BadRequest(e.to_string()))?;
            html_content = String::from_utf8_lossy(&bytes).to_string();
        }
    }

    if html_content.is_empty() {
        return Err(AppError::BadRequest("No file uploaded".into()));
    }

    let (job_id, total) = service::start_import(&state, user_id, &html_content).await?;

    Ok((StatusCode::ACCEPTED, Json(json!({ "job_id": job_id, "total": total }))).into_response())
}

/// GET /api/v1/bookmarks/import/status/:job_id
pub async fn import_status(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(job_id): Path<String>,
) -> Result<Response, AppError> {
    let status = service::get_import_status(&state, user_id, &job_id).await?;
    Ok(Json(status).into_response())
}

/// POST /api/v1/bookmarks/reprocess-weak
pub async fn reprocess_weak_bookmarks(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
) -> Result<Response, AppError> {
    let count = service::reprocess_weak(&state, user_id).await?;
    Ok(Json(json!({ "dispatched": count })).into_response())
}

/// POST /api/v1/bookmarks/reprocess-all
pub async fn reprocess_all_bookmarks(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
) -> Result<Response, AppError> {
    let count = service::reprocess_all(&state, user_id).await?;
    Ok(Json(json!({ "dispatched": count })).into_response())
}

/// POST /api/v1/bookmarks/:id/reprocess
pub async fn reprocess_single_bookmark(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    service::reprocess_single(&state, user_id, &id).await?;
    Ok(Json(json!({ "dispatched": true, "id": id })).into_response())
}
