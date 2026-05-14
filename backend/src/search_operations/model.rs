use axum::{extract::{State, Query}, response::{Response, IntoResponse}, Extension, Json};
use bson::oid::ObjectId;
use crate::utils::{db::AppState, errors::AppError};
use super::{service, SearchQuery};

/// GET /api/v1/search?q=...&limit=20
pub async fn semantic_search(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Query(query): Query<SearchQuery>,
) -> Result<Response, AppError> {
    let result = service::hybrid_search(&state, user_id, &query).await?;
    Ok(Json(result).into_response())
}

/// GET /api/v1/search/tags
pub async fn get_tags(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
) -> Result<Response, AppError> {
    let result = service::get_all_tags(&state, user_id).await?;
    Ok(Json(result).into_response())
}
