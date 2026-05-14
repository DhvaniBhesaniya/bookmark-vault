use bson::{doc, oid::ObjectId};
use chrono::Utc;
use crate::utils::{db::AppState, errors::AppError};
use super::{BookmarkCollection, CreateCollectionRequest};

pub async fn list_all(
    state: &AppState,
    user_id: ObjectId,
) -> Result<Vec<BookmarkCollection>, AppError> {
    let coll = state.collection::<BookmarkCollection>("collections");
    let mut cursor = coll.find(doc! { "user_id": user_id }).await?;
    let mut collections = Vec::new();
    while cursor.advance().await? {
        collections.push(cursor.deserialize_current()?);
    }
    Ok(collections)
}

pub async fn create(
    state: &AppState,
    user_id: ObjectId,
    body: CreateCollectionRequest,
) -> Result<serde_json::Value, AppError> {
    let coll = state.collection::<BookmarkCollection>("collections");
    let collection = BookmarkCollection {
        id: None,
        user_id,
        name: body.name,
        color: body.color,
        created_at: Utc::now(),
    };
    let result = coll.insert_one(&collection).await?;
    Ok(serde_json::json!({ "id": result.inserted_id }))
}

pub async fn update(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
    body: CreateCollectionRequest,
) -> Result<(), AppError> {
    let oid = ObjectId::parse_str(id)?;
    let coll = state.collection::<BookmarkCollection>("collections");
    let mut update = doc! {};
    update.insert("name", &body.name);
    if let Some(color) = &body.color {
        update.insert("color", color);
    }
    coll.update_one(
        doc! { "_id": oid, "user_id": user_id },
        doc! { "$set": update },
    ).await?;
    Ok(())
}

pub async fn delete(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
) -> Result<(), AppError> {
    let oid = ObjectId::parse_str(id)?;
    let coll = state.collection::<BookmarkCollection>("collections");
    coll.delete_one(doc! { "_id": oid, "user_id": user_id }).await?;
    // Unset collection_id on bookmarks
    let bookmarks = state.collection::<bson::Document>("bookmarks");
    bookmarks.update_many(
        doc! { "collection_id": oid, "user_id": user_id },
        doc! { "$unset": { "collection_id": "" } },
    ).await?;
    Ok(())
}
