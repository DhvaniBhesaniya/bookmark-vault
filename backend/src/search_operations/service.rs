use bson::{doc, oid::ObjectId, Bson, Document};
use mongodb::error::Error as MongoError;
use std::collections::HashMap;
use crate::utils::{db::AppState, errors::AppError};
use crate::bookmark_operations::Bookmark;
use super::SearchQuery;

/// Main hybrid search: vector + keyword, with fallbacks.
pub async fn hybrid_search(
    state: &AppState,
    user_id: ObjectId,
    query: &SearchQuery,
) -> Result<serde_json::Value, AppError> {
    let bookmarks_collection = state.collection::<Bookmark>("bookmarks");
    let total_user_bookmarks = bookmarks_collection
        .count_documents(doc! { "user_id": user_id.clone() })
        .await? as i64;

    let requested_limit = query.limit.unwrap_or(total_user_bookmarks.max(1));
    let limit = requested_limit.max(1);
    let effective_min_score = query
        .min_score
        .or(state.config.search_min_score)
        .map(|score| score.clamp(0.0, 1.0));
    let collection_filter = match query.collection_id.as_deref().map(str::trim) {
        Some("") | None => None,
        Some(raw) => Some(
            ObjectId::parse_str(raw)
                .map_err(|_| AppError::BadRequest("Invalid collection_id".into()))?,
        ),
    };

    // Generate embedding for query
    if state.config.gemini_api_keys.is_empty() {
        return text_search_fallback(
            state,
            user_id.clone(),
            &query.q,
            limit,
            collection_filter.clone(),
        )
        .await;
    }

    let query_embedding = state.gemini.generate_embedding(&query.q)
        .await
        .map_err(|e| AppError::Internal(format!("Embedding failed: {}", e)))?;

    let vector_limit = limit;
    let keyword_limit = (limit * 2).min(2000).max(20);

    let (vector_candidates, keyword_candidates) = tokio::try_join!(
        fetch_vector_candidates(
            state,
            user_id.clone(),
            &query_embedding,
            vector_limit,
            collection_filter.clone(),
        ),
        fetch_keyword_candidates(
            state,
            user_id.clone(),
            &query.q,
            keyword_limit,
            collection_filter.clone(),
        ),
    )?;

    let results = merge_hybrid_candidates(
        vector_candidates,
        keyword_candidates,
        limit as usize,
        effective_min_score,
    );

    // for (rank, doc) in results.iter().take(20).enumerate() {
    //     let title = doc.get_str("title").unwrap_or("untitled");
    //     let score = doc.get_f64("score").unwrap_or(0.0);
     // tracing::info!("search_rank={} score={:.4} title={}", rank + 1, score, title);
    // }

    let count = results.len();

    Ok(serde_json::json!({
        "results": results,
        "query": query.q,
        "count": count,
        "min_score_applied": effective_min_score,
    }))
}

/// Fetch all distinct tags for a user.
pub async fn get_all_tags(
    state: &AppState,
    user_id: ObjectId,
) -> Result<serde_json::Value, AppError> {
    let collection = state.db.collection::<bson::Document>("bookmarks");

    let pipeline = vec![
        doc! { "$match": { "user_id": user_id } },
        doc! { "$unwind": "$tags" },
        doc! { "$group": { "_id": "$tags", "count": { "$sum": 1 } } },
        doc! { "$sort": { "count": -1 } },
        doc! { "$project": { "_id": 0, "name": "$_id", "count": 1 } },
    ];

    let mut cursor = collection.aggregate(pipeline).await?;
    let mut tags = Vec::new();

    while cursor.advance().await? {
        tags.push(cursor.deserialize_current()?);
    }

    Ok(serde_json::json!({ "tags": tags }))
}

// ─── Internal helpers ────────────────────────────────────────────────────────

fn extract_doc_id_key(doc: &Document) -> Option<String> {
    match doc.get("_id") {
        Some(Bson::ObjectId(oid)) => Some(oid.to_hex()),
        Some(Bson::String(id)) => Some(id.to_string()),
        Some(other) => Some(other.to_string()),
        None => None,
    }
}

async fn fetch_vector_candidates(
    state: &AppState,
    user_id: ObjectId,
    query_embedding: &[f64],
    limit: i64,
    collection_filter: Option<ObjectId>,
) -> Result<Vec<Document>, AppError> {
    let mut vector_filter = doc! { "user_id": user_id };
    if let Some(collection_id) = collection_filter {
        vector_filter.insert("collection_id", collection_id);
    }

    let pipeline = vec![
        doc! {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": (limit * 3).min(5000),
                "limit": limit,
                "filter": vector_filter
            }
        },
        doc! {
            "$addFields": {
                "vector_score": { "$meta": "vectorSearchScore" }
            }
        },
    ];

    let collection = state.db.collection::<Document>("bookmarks");
    let mut cursor = collection.aggregate(pipeline).await?;

    let mut results: Vec<Document> = Vec::new();
    while cursor.advance().await? {
        results.push(cursor.deserialize_current()?);
    }

    Ok(results)
}

async fn fetch_keyword_candidates(
    state: &AppState,
    user_id: ObjectId,
    query: &str,
    limit: i64,
    collection_filter: Option<ObjectId>,
) -> Result<Vec<Document>, AppError> {
    let mut match_doc = doc! {
        "user_id": user_id,
        "$text": { "$search": query }
    };
    if let Some(collection_id) = collection_filter {
        match_doc.insert("collection_id", collection_id);
    }

    let pipeline = vec![
        doc! {
            "$match": match_doc
        },
        doc! {
            "$addFields": {
                "keyword_score": { "$meta": "textScore" }
            }
        },
        doc! {
            "$sort": { "keyword_score": -1 }
        },
        doc! {
            "$limit": limit
        },
    ];

    let collection = state.db.collection::<Document>("bookmarks");
    let mut cursor = match collection.aggregate(pipeline).await {
        Ok(cursor) => cursor,
        Err(e) if is_missing_text_index_error(&e) => {
            tracing::warn!(
                "Text index missing for keyword candidates; falling back to vector-only ranking"
            );
            return Ok(Vec::new());
        }
        Err(e) => return Err(AppError::MongoDB(e)),
    };

    let mut results: Vec<Document> = Vec::new();
    while cursor.advance().await? {
        results.push(cursor.deserialize_current()?);
    }

    Ok(results)
}

fn merge_hybrid_candidates(
    vector_candidates: Vec<Document>,
    keyword_candidates: Vec<Document>,
    limit: usize,
    min_score: Option<f64>,
) -> Vec<Document> {
    let mut merged: HashMap<String, Document> = HashMap::new();

    for doc in vector_candidates {
        if let Some(key) = extract_doc_id_key(&doc) {
            merged.insert(key, doc);
        }
    }

    for keyword_doc in keyword_candidates {
        if let Some(key) = extract_doc_id_key(&keyword_doc) {
            if let Some(existing) = merged.get_mut(&key) {
                if let Ok(keyword_score) = keyword_doc.get_f64("keyword_score") {
                    existing.insert("keyword_score", keyword_score);
                }
            } else {
                merged.insert(key, keyword_doc);
            }
        }
    }

    let max_keyword_score = merged
        .values()
        .filter_map(|doc| doc.get_f64("keyword_score").ok())
        .fold(0.0_f64, f64::max);

    let mut ranked: Vec<Document> = merged
        .into_values()
        .map(|mut doc| {
            let vector_score = doc.get_f64("vector_score").unwrap_or(0.0);
            let keyword_score = doc.get_f64("keyword_score").unwrap_or(0.0);
            let normalized_keyword_score = if max_keyword_score > 0.0 {
                keyword_score / max_keyword_score
            } else {
                0.0
            };

            let final_score = 0.7 * vector_score + 0.3 * normalized_keyword_score;

            doc.insert("normalized_keyword_score", normalized_keyword_score);
            doc.insert("score", final_score);
            doc
        })
        .collect();

    ranked.sort_by(|a, b| {
        let score_a = a.get_f64("score").unwrap_or(0.0);
        let score_b = b.get_f64("score").unwrap_or(0.0);
        score_b.partial_cmp(&score_a).unwrap_or(std::cmp::Ordering::Equal)
    });

    if let Some(threshold) = min_score {
        ranked.retain(|doc| doc.get_f64("score").unwrap_or(0.0) >= threshold);
    }

    ranked.truncate(limit);
    ranked
}

async fn text_search_fallback(
    state: &AppState,
    user_id: ObjectId,
    query: &str,
    limit: i64,
    collection_filter: Option<ObjectId>,
) -> Result<serde_json::Value, AppError> {
    let collection = state.collection::<Bookmark>("bookmarks");

    let mut filter = doc! {
        "user_id": user_id,
        "$text": { "$search": query }
    };
    if let Some(collection_id) = collection_filter.clone() {
        filter.insert("collection_id", collection_id);
    }

    let mut cursor = match collection.find(filter).limit(limit).await {
        Ok(cursor) => cursor,
        Err(e) if is_missing_text_index_error(&e) => {
            tracing::warn!(
                "Text index missing during text fallback; using regex fallback for query={}",
                query
            );

            let mut regex_filter = doc! {
                "user_id": user_id,
                "$or": [
                    { "title": { "$regex": query, "$options": "i" } },
                    { "description": { "$regex": query, "$options": "i" } },
                    { "ai_summary": { "$regex": query, "$options": "i" } },
                    { "tags": { "$regex": query, "$options": "i" } }
                ]
            };
            if let Some(collection_id) = collection_filter {
                regex_filter.insert("collection_id", collection_id);
            }

            collection
                .find(regex_filter)
                .limit(limit)
                .await
                .map_err(AppError::MongoDB)?
        }
        Err(e) => return Err(AppError::MongoDB(e)),
    };

    let mut results = Vec::new();
    while cursor.advance().await? {
        let bookmark = cursor.deserialize_current()?;
        results.push(serde_json::json!({ "bookmark": bookmark, "score": 1.0 }));
    }

    let count = results.len();
    Ok(serde_json::json!({
        "results": results,
        "query": query,
        "count": count,
    }))
}

fn is_missing_text_index_error(error: &MongoError) -> bool {
    let message = error.to_string().to_lowercase();
    message.contains("text index required for $text query")
        || message.contains("indexnotfound")
        || message.contains("code 27")
}
