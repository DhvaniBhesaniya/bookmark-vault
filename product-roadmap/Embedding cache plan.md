# Embedding Cache — Implementation Plan
> Bookmark Vault | Rust

---

## The Problem This Solves

Every time you search, your app needs to convert the search query into a vector (embedding) before it can find similar bookmarks. Without a cache, this computation happens on every single search — wasting time and API quota.

**The fix:** Save the embedding the first time a query is computed. Next time the same query comes in, return the saved result instantly.

```
First search:  "rust tutorials" → compute embedding → save it → return result
Second search: "rust tutorials" → load saved embedding → return result instantly
```

---

## Three Ways to Store the Cache

You have three options. Each one is described below with its trade-offs so you can pick what fits your project.

---

### Option 1 — In-Memory (HashMap)

**What it is:** A `HashMap<String, Vec<f32>>` that lives in RAM while your app is running.

**Trade-off:** Fast. But the cache is gone when your app exits. Every restart starts from zero.

**Best for:** Development and testing. Not ideal for production.

```toml
# Cargo.toml — no extra dependencies needed
```

```rust
use std::collections::HashMap;

pub struct InMemoryCache {
    store: HashMap<String, Vec<f32>>,
}

impl InMemoryCache {
    pub fn new() -> Self {
        Self { store: HashMap::new() }
    }

    pub fn get(&self, query: &str) -> Option<&Vec<f32>> {
        self.store.get(&normalize(query))
    }

    pub fn insert(&mut self, query: &str, embedding: Vec<f32>) {
        self.store.insert(normalize(query), embedding);
    }
}

// Normalize so "Rust" and "rust" hit the same cache entry
fn normalize(query: &str) -> String {
    query.trim().to_lowercase()
}
```

---

### Option 2 — Sled (Local File on Disk)

**What it is:** `sled` is an embedded database — a single file on your disk, no server needed. It works like a HashMap but survives restarts.

**Trade-off:** Persistent and fast. But it only works on the same machine. If you deploy your app to a server, the sled file lives on that server — not accessible from anywhere else.

**Best for:** A desktop app or a single-machine deployment where you want zero external dependencies.

```toml
# Cargo.toml
sled = "0.34"
bincode = "1"
```

```rust
pub struct SledCache {
    db: sled::Db,
}

impl SledCache {
    /// Opens (or creates) a file at the given path, e.g. "cache.db"
    pub fn new(path: &str) -> anyhow::Result<Self> {
        Ok(Self { db: sled::open(path)? })
    }

    pub fn get(&self, query: &str) -> anyhow::Result<Option<Vec<f32>>> {
        let key = normalize(query);
        match self.db.get(key.as_bytes())? {
            Some(bytes) => Ok(Some(bincode::deserialize(&bytes)?)),
            None => Ok(None),
        }
    }

    pub fn insert(&self, query: &str, embedding: &Vec<f32>) -> anyhow::Result<()> {
        let key = normalize(query);
        let bytes = bincode::serialize(embedding)?;
        self.db.insert(key.as_bytes(), bytes)?;
        Ok(())
    }
}

fn normalize(query: &str) -> String {
    query.trim().to_lowercase()
}
```

---

### Option 3 — MongoDB (Your Existing Database)

**What it is:** A separate collection in your MongoDB Atlas database called `query_cache`. Each document stores one query and its embedding.

**Trade-off:** Persistent, works across multiple machines or deployments, and you already have MongoDB set up. The only cost is a small network round-trip (~5–15ms per lookup).

**Best for:** Your bookmark vault — you already have MongoDB, so no extra setup needed.

```toml
# Cargo.toml
mongodb = "3"
serde = { version = "1", features = ["derive"] }
chrono = { version = "0.4", features = ["serde"] }
```

**The document shape stored in MongoDB:**
```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct QueryCacheDoc {
    #[serde(rename = "_id")]
    pub query: String,                            // the normalized query text is the key
    pub embedding: Vec<f32>,                      // the stored vector
    pub hit_count: u32,                           // how many times this query was searched
    pub cached_at: chrono::DateTime<chrono::Utc>,
}
```

**The cache implementation:**
```rust
use mongodb::{Collection, bson::doc};

pub struct MongoCache {
    collection: Collection<QueryCacheDoc>,
}

impl MongoCache {
    pub fn new(collection: Collection<QueryCacheDoc>) -> Self {
        Self { collection }
    }

    pub async fn get(&self, query: &str) -> anyhow::Result<Option<Vec<f32>>> {
        let key = normalize(query);

        // Find the document and increment hit_count at the same time
        let result = self.collection
            .find_one_and_update(
                doc! { "_id": &key },
                doc! { "$inc": { "hit_count": 1 } },
                None,
            )
            .await?;

        Ok(result.map(|doc| doc.embedding))
    }

    pub async fn insert(&self, query: &str, embedding: Vec<f32>) -> anyhow::Result<()> {
        let doc = QueryCacheDoc {
            query: normalize(query),
            embedding,
            hit_count: 1,
            cached_at: chrono::Utc::now(),
        };

        // upsert = insert if not exists, skip if already there
        self.collection
            .update_one(
                doc! { "_id": &doc.query },
                doc! { "$setOnInsert": mongodb::bson::to_bson(&doc)? },
                mongodb::options::UpdateOptions::builder().upsert(true).build(),
            )
            .await?;

        Ok(())
    }
}

fn normalize(query: &str) -> String {
    query.trim().to_lowercase()
}
```

**MongoDB index to create once (in Atlas UI or mongosh):**
```javascript
// Auto-deletes cache entries older than 30 days — keeps your 512MB free tier clean
db.query_cache.createIndex({ "cached_at": 1 }, { expireAfterSeconds: 2592000 })
```

---

## How the Cache Plugs Into Your Embedder

Regardless of which option you pick above, the usage pattern is identical:

```rust
pub async fn embed_query(
    cache: &MongoCache,        // swap this for SledCache or InMemoryCache
    local_model: &LocalEmbedder,
    query: &str,
) -> anyhow::Result<Vec<f32>> {

    // Step 1: Check cache
    if let Some(cached) = cache.get(query).await? {
        tracing::debug!("Cache HIT: {}", query);
        return Ok(cached);
    }

    // Step 2: Cache miss — compute with local model (free, no API call)
    tracing::debug!("Cache MISS: {}", query);
    let embedding = local_model.embed_query(query)?;

    // Step 3: Save for next time
    cache.insert(query, embedding.clone()).await?;

    Ok(embedding)
}
```

---

## Option Comparison

| | In-Memory | Sled | MongoDB |
|---|---|---|---|
| Persists across restarts | No | Yes | Yes |
| Works across machines | No | No | Yes |
| Extra setup required | None | One file | Already have it |
| Lookup speed | ~0ms | ~1ms | ~5–15ms |
| Extra dependencies | None | `sled`, `bincode` | `mongodb` |
| **Recommended for this project** | Dev only | Desktop app | **Production** |

---

## Recommended Stack for This Project

Since you are on MongoDB Atlas M0 free tier:

1. **Use Option 3 (MongoDB)** as your persistent cache
2. **Use `text-embedding-004`** (768-dim) from Gemini at import time — once per bookmark
3. **Use `all-MiniLML6V2`** local model for all search queries — free, no API calls
4. **Let the TTL index** auto-clean old cache entries so you stay within 512MB

This means you only ever call the Gemini API when you import new bookmarks. Every search query is handled entirely offline by the local model, with results cached in MongoDB so repeat searches are instant.