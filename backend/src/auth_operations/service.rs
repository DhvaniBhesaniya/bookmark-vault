use mongodb::bson::doc;
use crate::utils::{db::AppState, errors::AppError};
use crate::middleware::auth::create_token;
use super::{AuthResponse, LoginRequest, RegisterRequest, User};

pub async fn register_user(
    state: &AppState,
    body: RegisterRequest,
) -> Result<AuthResponse, AppError> {
    let users = state.collection::<User>("users");

    // Check if email already exists
    if users.find_one(doc! { "email": &body.email }).await?.is_some() {
        return Err(AppError::Conflict("Email already registered".into()));
    }

    // Hash password
    let password_hash = bcrypt::hash(&body.password, 12)?;

    let user = User {
        id: None,
        email: body.email.clone(),
        password_hash,
        created_at: chrono::Utc::now(),
    };

    let result = users.insert_one(&user).await?;
    let user_id = result
        .inserted_id
        .as_object_id()
        .ok_or_else(|| AppError::Internal("Failed to get user ID".into()))?;

    let token = create_token(&user_id, &body.email, &state.config.jwt_secret)?;

    Ok(AuthResponse {
        token,
        email: body.email,
    })
}

pub async fn login_user(
    state: &AppState,
    body: LoginRequest,
) -> Result<AuthResponse, AppError> {
    let users = state.collection::<User>("users");

    let user = users
        .find_one(doc! { "email": &body.email })
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

    if !bcrypt::verify(&body.password, &user.password_hash)? {
        return Err(AppError::Unauthorized("Invalid email or password".into()));
    }

    let user_id = user
        .id
        .ok_or_else(|| AppError::Internal("Missing user ID".into()))?;
    let token = create_token(&user_id, &body.email, &state.config.jwt_secret)?;

    Ok(AuthResponse {
        token,
        email: body.email,
    })
}
