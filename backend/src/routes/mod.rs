use axum::{
    middleware::from_fn_with_state,
    routing::get,
    Router,
};
use crate::utils::db::AppState;
use crate::middleware;
use crate::{auth_operations, bookmark_operations, collection_operations, search_operations};

/// Build the full application router by aggregating routes from all operation modules.
pub fn build_router(state: AppState) -> Router {
    // Public routes (no auth required)
    let public_routes = auth_operations::routes();

    // Protected routes (require JWT)
    let protected_routes = bookmark_operations::routes()
        .merge(search_operations::routes())
        .merge(collection_operations::routes())
        .layer(from_fn_with_state(
            state.clone(),
            middleware::auth::auth_middleware,
        ));

    Router::new()
        .nest("/api/v1", public_routes.merge(protected_routes))
        .route("/health", get(|| async { "ok" }))
        .with_state(state)
}
