use axum::{
    extract::{Request, State},
    http::header,
    middleware::Next,
    response::Response,
};
use bson::oid::ObjectId;
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};
use crate::{utils::db::AppState, utils::errors::AppError};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // user_id as hex string
    pub email: String,
    pub exp: usize,
}

/// Extract user_id from JWT and inject into request extensions
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let auth_header = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".into()))?;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map_err(|_| AppError::Unauthorized("Invalid or expired token".into()))?;

    let user_id = ObjectId::parse_str(&token_data.claims.sub)
        .map_err(|_| AppError::Unauthorized("Invalid user ID in token".into()))?;

    // Inject user_id into request extensions
    req.extensions_mut().insert(user_id);
    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}

/// Create a JWT token for a user
pub fn create_token(user_id: &ObjectId, email: &str, secret: &str) -> Result<String, AppError> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(4))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_hex(),
        email: email.to_string(),
        exp: expiration,
    };

    let token = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &claims,
        &jsonwebtoken::EncodingKey::from_secret(secret.as_bytes()),
    )?;

    Ok(token)
}
