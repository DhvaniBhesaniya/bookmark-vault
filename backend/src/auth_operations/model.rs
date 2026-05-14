use axum::{
    extract::State,
    Extension,
    Json,
    response::{IntoResponse, Response},
};


use bson::oid::ObjectId;

use crate::utils::{db::AppState, errors::AppError};

use super::{service, LoginRequest, RegisterRequest};



#[derive(Debug, Clone, serde::Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<Response, AppError> {
    let response = service::register_user(&state, body).await?;
    Ok(Json(response).into_response())
}

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Response, AppError> {
    let response = service::login_user(&state, body).await?;
    Ok(Json(response).into_response())
}

pub async fn change_password(
    State(state): State<AppState>,
    Extension(user_id): Extension<ObjectId>,
    Json(body): Json<ChangePasswordRequest>,
) -> Result<Response, AppError> {
    service::change_password(&state, user_id, body).await?;

    Ok(Json(serde_json::json!({ "status": "ok" })).into_response())
}


