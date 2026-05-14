use axum::{
    extract::{State, Path},
    http::StatusCode,
    response::{Response, IntoResponse},
    Extension, Json,
};
use bson::oid::ObjectId;
use serde_json::json;
use crate::utils::{db::AppState, errors::AppError};
use super::{service, CreateCollectionRequest};

pub async fn list_collections(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
) -> Result<Response, AppError> {
    let collections = service::list_all(&state, user_id).await?;
    Ok(Json(collections).into_response())
}

pub async fn create_collection(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Json(body): Json<CreateCollectionRequest>,
) -> Result<Response, AppError> {
    let result = service::create(&state, user_id, body).await?;
    Ok((StatusCode::CREATED, Json(result)).into_response())
}

pub async fn update_collection(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
    Json(body): Json<CreateCollectionRequest>,
) -> Result<Response, AppError> {
    service::update(&state, user_id, &id, body).await?;
    Ok(Json(json!({ "updated": true })).into_response())
}

pub async fn delete_collection(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Path(id): Path<String>,
) -> Result<Response, AppError> {
    service::delete(&state, user_id, &id).await?;
    Ok(StatusCode::NO_CONTENT.into_response())
}
