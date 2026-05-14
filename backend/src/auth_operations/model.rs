use axum::{extract::State, Json, response::{Response, IntoResponse}};
use crate::utils::{db::AppState, errors::AppError};
use super::{service, LoginRequest, RegisterRequest};

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
