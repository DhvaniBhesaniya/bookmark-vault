use bson::{doc, oid::ObjectId};
use chrono::{TimeZone, Utc};
use scraper::{Html, Selector};
use uuid::Uuid;
use crate::utils::{db::AppState, errors::AppError, scraper as meta_scraper};
use super::{
    Bookmark, BookmarkListResponse, BookmarkQuery, BookmarkType,
    CreateBookmarkOutcome, CreateBookmarkRequest, ImportJob,
    ParsedBookmark, UpdateBookmarkRequest,
};

// ─── List ────────────────────────────────────────────────────────────────────

pub async fn list_bookmarks(
    state: &AppState,
    user_id: ObjectId,
    query: BookmarkQuery,
) -> Result<BookmarkListResponse, AppError> {
    let collection = state.collection::<Bookmark>("bookmarks");
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let skip = (page - 1) * limit;

    let mut filter = doc! { "user_id": user_id };
    if let Some(t) = &query.item_type {
        filter.insert("type", t);
    }
    if let Some(tags_str) = &query.tags {
        let tags_list: Vec<&str> = tags_str.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
        if !tags_list.is_empty() {
            filter.insert("tags", doc! { "$in": tags_list });
        }
    }
    if let Some(domain) = &query.domain {
        filter.insert("domain", domain);
    }
    if query.favorite == Some(true) {
        filter.insert("is_favorite", true);
    }
    if let Some(collection_id) = &query.collection_id {
        let collection_id = collection_id.trim();
        if !collection_id.is_empty() {
            let collection_oid = ObjectId::parse_str(collection_id)
                .map_err(|_| AppError::BadRequest("Invalid collection_id".into()))?;
            filter.insert("collection_id", collection_oid);
        }
    }

    let total = collection.count_documents(filter.clone()).await?;

    let fetch_all = query.all.unwrap_or(false);

    let mut find_action = collection
        .find(filter)
        .sort(doc! { "created_at": -1 });

    if !fetch_all {
        find_action = find_action.skip(skip).limit(limit as i64);
    }

    let mut cursor = find_action.await?;

    let mut bookmarks = Vec::new();
    while cursor.advance().await? {
        bookmarks.push(cursor.deserialize_current()?);
    }

    let response_page = if fetch_all { 1 } else { page };
    let response_limit = if fetch_all {
        total.min(u64::MAX)
    } else {
        limit
    };

    Ok(BookmarkListResponse {
        bookmarks,
        total,
        page: response_page,
        limit: response_limit,
    })
}

// ─── Create ──────────────────────────────────────────────────────────────────

pub async fn create_bookmark(
    state: &AppState,
    user_id: ObjectId,
    body: CreateBookmarkRequest,
) -> Result<CreateBookmarkOutcome, AppError> {
    let collection = state.collection::<Bookmark>("bookmarks");
    let now = Utc::now();

    let title = body.title.clone().unwrap_or_else(|| "Processing...".to_string());
    let domain = body.url.as_ref().and_then(|u| {
        url::Url::parse(u).ok().and_then(|u| u.host_str().map(|h| h.replace("www.", "")))
    });

    // Check for existing duplicate by domain
    if let Some(ref d) = domain {
        if let Some(existing) = collection.find_one(doc! { "user_id": user_id, "domain": d }).await? {
            if let Some(id) = existing.id {
                if let Some(ref url) = body.url {
                    collection.update_one(
                        doc! { "_id": id },
                        doc! { "$addToSet": { "duplicate_links": url }, "$set": { "updated_at": Utc::now() } },
                    ).await?;
                }
                return Ok(CreateBookmarkOutcome::AlreadyExists {
                    id: id.to_hex(),
                    message: Some("Added as duplicate link"),
                });
            }
        }
    } else if let Some(ref url) = body.url {
        // Fallback to exact URL match if no domain could be parsed
        if let Some(existing) = collection.find_one(doc! { "user_id": user_id, "url": url }).await? {
            return Ok(CreateBookmarkOutcome::AlreadyExists {
                id: existing.id.unwrap().to_hex(),
                message: None,
            });
        }
    }

    let bookmark = Bookmark {
        id: None,
        user_id,
        item_type: body.item_type,
        url: body.url.clone(),
        title,
        description: None,
        favicon: None,
        og_image: None,
        domain,
        tags: vec![],
        ai_summary: None,
        notes: body.notes,
        is_favorite: false,
        collection_id: None,
        duplicate_links: None,
        embedding: None,
        status: "processing".to_string(),
        created_at: now,
        updated_at: now,
    };

    let result = collection.insert_one(&bookmark).await?;
    let bookmark_id = result.inserted_id.as_object_id()
        .ok_or_else(|| AppError::Internal("Failed to get bookmark ID".into()))?;

    Ok(CreateBookmarkOutcome::Created {
        id: bookmark_id,
        url: body.url,
    })
}

// ─── Process (background AI pipeline) ────────────────────────────────────────

pub async fn process_bookmark(state: &AppState, id: ObjectId, url: Option<String>) -> anyhow::Result<()> {
    let collection = state.collection::<Bookmark>("bookmarks");

    let existing = collection
        .find_one(doc! { "_id": id })
        .await?
        .ok_or_else(|| anyhow::anyhow!("Bookmark not found while processing"))?;

    let mut update_doc = doc! {};
    let effective_url = url.or_else(|| existing.url.clone());

    // 1. Fetch metadata if URL provided
    if let Some(ref url) = effective_url {
        match meta_scraper::fetch_metadata(url).await {
            Ok(meta) => {
                let scraped_domain = meta.domain.as_deref();
                let title_candidate = meta.title.as_deref().unwrap_or("");

                // Only use scraped title if it's actually good — never overwrite with garbage
                if !title_candidate.is_empty()
                    && !meta_scraper::is_low_quality_title(title_candidate, scraped_domain)
                {
                    update_doc.insert("title", title_candidate);
                } else if let Ok(parsed_url) = url::Url::parse(url) {
                    if let Some(path_title) = meta_scraper::title_from_url_path(&parsed_url) {
                        update_doc.insert("title", path_title);
                    }
                    // Otherwise keep existing title — don't overwrite with domain name
                }

                if let Some(d) = &meta.description { update_doc.insert("description", d); }
                if let Some(f) = &meta.favicon { update_doc.insert("favicon", f); }
                if let Some(o) = &meta.og_image { update_doc.insert("og_image", o); }
                if let Some(d) = &meta.domain { update_doc.insert("domain", d); }
            }
            Err(e) => {
                tracing::warn!("Metadata fetch failed after retries: {}", e);
                if let Ok(parsed_url) = url::Url::parse(url) {
                    if let Some(path_title) = meta_scraper::title_from_url_path(&parsed_url) {
                        update_doc.insert("title", path_title);
                    }
                    if let Some(host) = parsed_url.host_str() {
                        update_doc.insert("domain", host.replace("www.", ""));
                    }
                }
            }
        }
    }

    // 2. AI tagging & summary
    let current_title = update_doc
        .get_str("title")
        .ok()
        .filter(|t| !t.trim().is_empty())
        .map(ToString::to_string)
        .unwrap_or_else(|| existing.title.clone());
    let description = update_doc
        .get_str("description")
        .ok()
        .filter(|d| !d.trim().is_empty())
        .map(ToString::to_string)
        .or_else(|| existing.description.clone())
        .unwrap_or_default();
    let url_str = effective_url.as_deref().unwrap_or("");

    if !state.config.gemini_api_keys.is_empty() {
        match state.gemini.generate_tags_and_summary(&current_title, &description, url_str).await {
            Ok(result) => {
                // Use AI-generated title if current title is low-quality
                let title_is_weak = meta_scraper::is_low_quality_title(
                    &current_title,
                    existing.domain.as_deref(),
                );
                if let Some(ref ai_title) = result.title {
                    if title_is_weak && !ai_title.trim().is_empty() {
                        update_doc.insert("title", ai_title.as_str());
                    }
                }

                update_doc.insert("tags", &result.tags);
                update_doc.insert("ai_summary", &result.summary);

                // 3. Generate embedding — use best available title
                let final_title = update_doc
                    .get_str("title")
                    .unwrap_or(&current_title);
                let embed_text = format!("{} {} {}", final_title, result.summary, result.tags.join(" "));
                match state.gemini.generate_embedding(&embed_text).await {
                    Ok(embedding) => { update_doc.insert("embedding", embedding); }
                    Err(e) => tracing::warn!("Embedding generation failed: {}", e),
                }
            }
            Err(e) => tracing::warn!("Tag generation failed: {}", e),
        }
    }

    update_doc.insert("status", "ready");
    update_doc.insert("updated_at", Utc::now());

    collection.update_one(doc! { "_id": id }, doc! { "$set": update_doc }).await?;
    tracing::info!("Processed bookmark: {}", id);
    Ok(())
}

// ─── Get ─────────────────────────────────────────────────────────────────────

pub async fn get_bookmark(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
) -> Result<Bookmark, AppError> {
    let oid = ObjectId::parse_str(id)?;
    let collection = state.collection::<Bookmark>("bookmarks");
    let bookmark = collection
        .find_one(doc! { "_id": oid, "user_id": user_id })
        .await?
        .ok_or_else(|| AppError::NotFound("Bookmark not found".into()))?;
    Ok(bookmark)
}

// ─── Update ──────────────────────────────────────────────────────────────────

pub async fn update_bookmark(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
    body: UpdateBookmarkRequest,
) -> Result<(), AppError> {
    let oid = ObjectId::parse_str(id)?;
    let collection = state.collection::<Bookmark>("bookmarks");

    let mut update_doc = doc! { "updated_at": Utc::now() };
    if let Some(title) = &body.title { update_doc.insert("title", title); }
    if let Some(notes) = &body.notes { update_doc.insert("notes", notes); }
    if let Some(tags) = &body.tags { update_doc.insert("tags", tags); }
    if let Some(links) = &body.duplicate_links {
        let filtered_links: Vec<String> = links.iter().filter(|l| !l.trim().is_empty()).cloned().collect();
        update_doc.insert("duplicate_links", filtered_links);
    }
    if let Some(fav) = body.is_favorite { update_doc.insert("is_favorite", fav); }
    if let Some(collection_id) = &body.collection_id {
        if collection_id.trim().is_empty() {
            update_doc.insert("collection_id", bson::Bson::Null);
        } else {
            let collection_oid = ObjectId::parse_str(collection_id)
                .map_err(|_| AppError::BadRequest("Invalid collection_id".into()))?;
            update_doc.insert("collection_id", collection_oid);
        }
    }

    let result = collection
        .update_one(doc! { "_id": oid, "user_id": user_id }, doc! { "$set": update_doc })
        .await?;

    if result.matched_count == 0 {
        return Err(AppError::NotFound("Bookmark not found".into()));
    }

    Ok(())
}

// ─── Delete ──────────────────────────────────────────────────────────────────

pub async fn delete_bookmark(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
) -> Result<(), AppError> {
    let oid = ObjectId::parse_str(id)?;
    let collection = state.collection::<Bookmark>("bookmarks");

    let result = collection.delete_one(doc! { "_id": oid, "user_id": user_id }).await?;
    if result.deleted_count == 0 {
        return Err(AppError::NotFound("Bookmark not found".into()));
    }

    Ok(())
}

// ─── Import ──────────────────────────────────────────────────────────────────

pub async fn start_import(
    state: &AppState,
    user_id: ObjectId,
    html_content: &str,
) -> Result<(String, u64), AppError> {
    let parsed = parse_bookmark_html(html_content);
    let total = parsed.len() as u64;
    let job_id = Uuid::new_v4().to_string();

    let jobs = state.collection::<ImportJob>("import_jobs");
    let job = ImportJob {
        id: None,
        user_id,
        job_id: job_id.clone(),
        total,
        processed: 0,
        status: "running".to_string(),
        created_at: Utc::now(),
        updated_at: None,
    };
    jobs.insert_one(&job).await?;

    // Spawn background import
    let bg_state = state.clone();
    let bg_job_id = job_id.clone();
    tokio::spawn(async move {
        process_import_batch(&bg_state, user_id, &bg_job_id, parsed).await;
    });

    Ok((job_id, total))
}

pub async fn get_import_status(
    state: &AppState,
    user_id: ObjectId,
    job_id: &str,
) -> Result<serde_json::Value, AppError> {
    let jobs = state.collection::<ImportJob>("import_jobs");
    let job = if let Some(job) = jobs
        .find_one(doc! { "job_id": job_id, "user_id": user_id })
        .await?
    {
        job
    } else {
        // Fallback for legacy/mismatched user_id values so polling doesn't fail mid-import.
        jobs
            .find_one(doc! { "job_id": job_id })
            .await?
            .ok_or_else(|| AppError::NotFound("Import job not found".into()))?
    };

    let percent = if job.total > 0 { ((job.processed as u64) * 100) / job.total } else { 0 };

    Ok(serde_json::json!({
        "job_id": job.job_id,
        "total": job.total,
        "processed": job.processed,
        "status": job.status,
        "percent": percent,
    }))
}

/// Parse Chrome/Firefox bookmark HTML export
pub fn parse_bookmark_html(html: &str) -> Vec<ParsedBookmark> {
    let document = Html::parse_document(html);
    let selector = Selector::parse("a").unwrap();
    let mut bookmarks = Vec::new();

    for element in document.select(&selector) {
        let href = match element.value().attr("href") {
            Some(h) => h.to_string(),
            None => continue,
        };

        // Skip non-HTTP URLs
        if !href.starts_with("http://") && !href.starts_with("https://") {
            continue;
        }

        let title = element.text().collect::<String>().trim().to_string();
        let title = if title.is_empty() { href.clone() } else { title };

        let timestamp = element
            .value()
            .attr("add_date")
            .and_then(|s| s.parse::<i64>().ok());

        bookmarks.push(ParsedBookmark { url: href, title, timestamp });
    }

    bookmarks
}

/// Process imported bookmarks in batches of 10
pub async fn process_import_batch(
    state: &AppState,
    user_id: ObjectId,
    job_id: &str,
    bookmarks: Vec<ParsedBookmark>,
) {
    let collection = state.collection::<Bookmark>("bookmarks");
    let jobs = state.collection::<bson::Document>("import_jobs");
    let total = bookmarks.len();

    let mut processed_count = 0;

    for chunk in bookmarks.chunks(10) {
        let mut gemini_inputs = Vec::new();
        let mut meta_map = std::collections::HashMap::new();

        // 1. Fetch metadata for the chunk
        for (i, parsed) in chunk.iter().enumerate() {
            let meta = meta_scraper::fetch_metadata(&parsed.url).await.unwrap_or_default();
            meta_map.insert(i, meta);
        }

        // 2. Prepare bookmarks for insertion
        for (i, parsed) in chunk.iter().enumerate() {
            let now = Utc::now();
            let created_at = parsed
                .timestamp
                .and_then(|ts| Utc.timestamp_opt(ts, 0).single())
                .unwrap_or(now);

            let meta = meta_map.get(&i).unwrap();
            let title = meta.title.clone().unwrap_or_else(|| parsed.title.clone());
            let domain = meta.domain.clone().or_else(|| url::Url::parse(&parsed.url).ok().and_then(|u| u.host_str().map(|h| h.replace("www.", ""))));

            let existing = if let Some(ref d) = domain {
                collection.find_one(doc! { "user_id": user_id, "domain": d }).await.unwrap_or(None)
            } else {
                collection.find_one(doc! { "user_id": user_id, "url": &parsed.url }).await.unwrap_or(None)
            };

            if let Some(existing_bookmark) = existing {
                if let Some(id) = existing_bookmark.id {
                    let _ = collection.update_one(
                        doc! { "_id": id },
                        doc! { "$addToSet": { "duplicate_links": &parsed.url }, "$set": { "updated_at": Utc::now() } },
                    ).await;
                }
                continue;
            }

            let bookmark = Bookmark {
                id: Some(ObjectId::new()),
                user_id,
                item_type: BookmarkType::Link,
                url: Some(parsed.url.clone()),
                title: title.clone(),
                description: meta.description.clone(),
                favicon: meta.favicon.clone(),
                og_image: meta.og_image.clone(),
                domain,
                tags: vec![],
                ai_summary: None,
                notes: None,
                is_favorite: false,
                collection_id: None,
                duplicate_links: None,
                embedding: None,
                status: "ready".to_string(),
                created_at,
                updated_at: now,
            };

            gemini_inputs.push((i, bookmark));
        }

        if gemini_inputs.is_empty() {
            processed_count += chunk.len();
            let _ = jobs.update_one(
                doc! { "job_id": job_id, "user_id": user_id },
                doc! { "$set": { "processed": processed_count as i64, "updated_at": Utc::now() } },
            ).await;
            continue;
        }

        // 3. Batch Tag Generation
        if !state.config.gemini_api_keys.is_empty() {
            let batch_input: Vec<_> = gemini_inputs.iter().map(|(i, b)| {
                (*i, b.title.clone(), b.description.clone().unwrap_or_default(), b.url.clone().unwrap_or_default())
            }).collect();

            if let Ok(mut batch_tags) = state.gemini.generate_tags_batch(&batch_input).await {
                // 4. Assign Tags and Embeddings
                for (i, b) in gemini_inputs.iter_mut() {
                    if let Some(tag_res) = batch_tags.remove(i) {
                        b.tags = tag_res.tags.clone();
                        b.ai_summary = Some(tag_res.summary.clone());

                        let embed_text = format!("{} {} {}", b.title, tag_res.summary, tag_res.tags.join(" "));
                        if let Ok(emb) = state.gemini.generate_embedding(&embed_text).await {
                            b.embedding = Some(emb);
                        }
                    }
                }
            }
        }

        // 5. Bulk Insert
        let docs_to_insert: Vec<_> = gemini_inputs.into_iter().map(|(_, b)| b).collect();
        if !docs_to_insert.is_empty() {
            if let Err(e) = collection.insert_many(docs_to_insert).await {
                tracing::error!("Failed to bulk insert bookmarks: {}", e);
            }
        }

        // 6. Update Progress and Delay
        processed_count += chunk.len();
        let _ = jobs.update_one(
            doc! { "job_id": job_id, "user_id": user_id },
            doc! { "$set": { "processed": processed_count as i64, "updated_at": Utc::now() } },
        ).await;

        tokio::time::sleep(std::time::Duration::from_secs(8)).await;
    }

    // Mark job complete
    let _ = jobs.update_one(
        doc! { "job_id": job_id, "user_id": user_id },
        doc! { "$set": { "status": "completed", "processed": total as i64 } },
    ).await;

    tracing::info!("Import job {} completed: {} bookmarks", job_id, total);
}

// ─── Reprocess Weak ──────────────────────────────────────────────────────────

pub async fn reprocess_weak(
    state: &AppState,
    user_id: ObjectId,
) -> Result<u64, AppError> {
    let collection = state.collection::<Bookmark>("bookmarks");

    let filter = doc! {
        "user_id": user_id,
        "$or": [
            { "status": "processing" },
            { "title": { "$exists": false } },
            { "title": "" },
            { "title": "Processing..." },
            { "title": { "$regex": "^.{0,3}$" } },
        ]
    };

    let mut cursor = collection.find(filter).await?;
    let mut count = 0u64;

    while cursor.advance().await? {
        let bookmark = cursor.deserialize_current()?;
        let id = match bookmark.id {
            Some(id) => id,
            None => continue,
        };
        let url = bookmark.url.clone();
        let bg_state = state.clone();

        let title_weak = meta_scraper::is_low_quality_title(
            &bookmark.title,
            bookmark.domain.as_deref(),
        );
        if !title_weak && bookmark.status == "ready" {
            continue;
        }

        tokio::spawn(async move {
            if let Err(e) = process_bookmark(&bg_state, id, url).await {
                tracing::error!("reprocess_weak: {} failed: {}", id, e);
            }
        });
        count += 1;
    }

    tracing::info!("reprocess_weak: dispatched {} jobs for user {}", count, user_id);
    Ok(count)
}

pub async fn reprocess_all(
    state: &AppState,
    user_id: ObjectId,
) -> Result<u64, AppError> {
    let collection = state.collection::<Bookmark>("bookmarks");
    let mut cursor = collection.find(doc! { "user_id": user_id }).await?;
    let mut count = 0u64;

    while cursor.advance().await? {
        let bookmark = cursor.deserialize_current()?;
        let id = match bookmark.id {
            Some(id) => id,
            None => continue,
        };

        let bg_state = state.clone();
        let bg_url = bookmark.url.clone();

        tokio::spawn(async move {
            if let Err(e) = process_bookmark(&bg_state, id, bg_url).await {
                tracing::error!("reprocess_all: {} failed: {}", id, e);
            }
        });
        count += 1;
    }

    tracing::info!("reprocess_all: dispatched {} jobs for user {}", count, user_id);
    Ok(count)
}

pub async fn reprocess_single(
    state: &AppState,
    user_id: ObjectId,
    id: &str,
) -> Result<(), AppError> {
    let oid = ObjectId::parse_str(id)?;
    let collection = state.collection::<Bookmark>("bookmarks");

    let bookmark = collection
        .find_one(doc! { "_id": oid, "user_id": user_id })
        .await?
        .ok_or_else(|| AppError::NotFound("Bookmark not found".into()))?;

    let bookmark_id = bookmark
        .id
        .ok_or_else(|| AppError::Internal("Bookmark is missing _id".into()))?;

    if state.config.gemini_api_keys.is_empty() {
        return Err(AppError::Internal("No Gemini API keys configured".into()));
    }

    let bg_state = state.clone();
    let title = bookmark.title.clone();
    let description = bookmark.description.clone().unwrap_or_default();
    let url_str = bookmark.url.clone().unwrap_or_default();

    tokio::spawn(async move {
        match bg_state.gemini.generate_tags_and_summary(&title, &description, &url_str).await {
            Ok(result) => {
                let mut update_doc = doc! { "updated_at": Utc::now() };

                // Use AI title if it returned one and current title is weak
                if let Some(ref ai_title) = result.title {
                    if !ai_title.trim().is_empty() {
                        update_doc.insert("title", ai_title.as_str());
                    }
                }

                if let Err(e) = bg_state.collection::<Bookmark>("bookmarks")
                    .update_one(doc! { "_id": bookmark_id }, doc! { "$set": update_doc })
                    .await
                {
                    tracing::error!("reprocess_single: DB update failed for {}: {}", bookmark_id, e);
                } else {
                    tracing::info!("reprocess_single: updated title for {}", bookmark_id);
                }
            }
            Err(e) => {
                tracing::error!("reprocess_single: AI call failed for {}: {}", bookmark_id, e);
            }
        }
    });

    Ok(())
}
  