mod utils;
mod middleware;
mod auth_operations;
mod bookmark_operations;
mod collection_operations;
mod search_operations;
mod routes;

use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use std::net::SocketAddr;
use crate::utils::config::Config;
use crate::utils::db::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let config = Config::from_env()?;
    let port = config.port;
    let cors_origin = config.cors_origin.clone();

    let state = AppState::new(config).await?;

    let app = routes::build_router(state)
        .layer(
            CorsLayer::new()
                .allow_origin(
                    cors_origin.parse::<axum::http::HeaderValue>()
                        .unwrap_or_else(|_| "*".parse().unwrap())
                )
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Bookmarkvault backend listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
