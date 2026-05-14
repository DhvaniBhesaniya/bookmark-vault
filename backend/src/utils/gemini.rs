use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

const GEMINI_BASE_URL: &str = "https://generativelanguage.googleapis.com/v1beta";

#[derive(Debug, Serialize, Deserialize)]
pub struct TagResult {
    pub tags: Vec<String>,
    pub summary: String,
}

#[derive(Clone)]
pub struct GeminiClient {
    client: Client,
    api_keys: Vec<String>,
    text_models: Vec<String>,
    embedding_models: Vec<String>,
}
#[derive(Deserialize)]
pub struct BatchTagResultItem {
    pub index: usize,
    pub tags: Vec<String>,
    pub summary: String,
}
#[derive(Deserialize)]
struct RawBatchResult {
    results: Vec<BatchTagResultItem>,
}
impl GeminiClient {
    /// Initialize the client with your fallback keys and models
    pub fn new(
        api_keys: Vec<String>,
        text_models: Vec<String>,
        embedding_models: Vec<String>,
    ) -> Self {
        Self {
            // Reusing the client keeps the connection pool active for better performance
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
            api_keys,
            text_models,
            embedding_models,
        }
    }

    /// Generate tags and summary using the fallback matrix (Keys -> Models)
    /// Uses Gemini's native JSON mode for reliable structured output.
    pub async fn generate_tags_and_summary(
        &self,
        title: &str,
        description: &str,
        url: &str,
    ) -> anyhow::Result<TagResult> {
        let user_prompt = format!(
            "Title: {}\nDescription: {}\nURL: {}",
            title, description, url
        );

        let body = serde_json::json!({
            "system_instruction": {
                "parts": [{
                    "text": "You are a bookmark tagging assistant. Analyze the given webpage info and return tags and a summary.\n\nRules for tags:\n- 5 to 8 tags maximum\n- All lowercase, no spaces (use hyphens)\n- Be specific\n- Include: topic, tool-type, use-case, language/framework if relevant"
                }]
            },
            "contents": [{
                "role": "user",
                "parts": [{ "text": user_prompt }]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "tags": {
                            "type": "ARRAY",
                            "items": { "type": "STRING" }
                        },
                        "summary": { "type": "STRING" }
                    },
                    "required": ["tags", "summary"]
                }
            }
        });

        // 1. Loop through API Keys
        for (key_idx, api_key) in self.api_keys.iter().enumerate() {
            // 2. Loop through Models
            for model in &self.text_models {
                let request_url = format!(
                    "{}/models/{}:generateContent?key={}",
                    GEMINI_BASE_URL, model, api_key
                );

                let response = match self.client.post(&request_url).json(&body).send().await {
                    Ok(res) => res,
                    Err(e) => {
                        tracing::warn!(
                            "Network error for model {} (Key {}): {}",
                            model,
                            key_idx,
                            e
                        );
                        continue;
                    }
                };

                let json: serde_json::Value = match response.json().await {
                    Ok(j) => j,
                    Err(_) => continue,
                };

                // Check for API errors
                if let Some(error) = json.get("error") {
                    let code = error["code"].as_i64().unwrap_or(0);
                    let message = error["message"].as_str().unwrap_or("Unknown");

                    if code == 429 || code == 503 || code == 500 {
                        tracing::warn!(
                            "Gemini error code {} for model {} on Key {}: {}. Failing over...",
                            code,
                            model,
                            key_idx,
                            message
                        );
                        continue;
                    } else if code == 404
                        || message.contains("is not found")
                        || message.contains("not supported")
                    {
                        tracing::warn!(
                            "Model {} unavailable on this API version (Key {}): {}. Trying next fallback model...",
                            model,
                            key_idx,
                            message
                        );
                        continue;
                    } else {
                        anyhow::bail!("Fatal API Error: {}", message);
                    }
                }

                // Native JSON mode: response is already clean JSON
                let text = json["candidates"][0]["content"]["parts"][0]["text"]
                    .as_str()
                    .unwrap_or("{}");

                let result: TagResult = serde_json::from_str(text).unwrap_or(TagResult {
                    tags: vec!["uncategorized".to_string()],
                    summary: "No summary available.".to_string(),
                });

                return Ok(result);
            }
        }

        anyhow::bail!("All API keys and text models exhausted. Tag generation failed.");
    }

    /// Generate tags and summaries for a batch of bookmarks to save tokens
    pub async fn generate_tags_batch(
        &self,
        bookmarks: &[(usize, String, String, String)], // (index, title, description, url)
    ) -> anyhow::Result<std::collections::HashMap<usize, TagResult>> {
        let mut user_prompt = String::new();
        for (idx, title, desc, url) in bookmarks {
            user_prompt.push_str(&format!(
                "Index: {}\nTitle: {}\nDescription: {}\nURL: {}\n\n",
                idx, title, desc, url
            ));
        }

        let body = serde_json::json!({
            "system_instruction": {
                "parts": [{
                    "text": "You are a bookmark tagging assistant. Analyze the batch of webpages and return tags and a summary for each one. You MUST return exactly one result object for every Index provided in the prompt.\n\nRules for tags:\n- 5 to 8 tags maximum\n- All lowercase, no spaces (use hyphens)\n- Be specific\n- Include: topic, tool-type, use-case, language/framework if relevant"
                }]
            },
            "contents": [{
                "role": "user",
                "parts": [{ "text": user_prompt }]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "results": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "index": { "type": "INTEGER" },
                                    "tags": { "type": "ARRAY", "items": { "type": "STRING" } },
                                    "summary": { "type": "STRING" }
                                },
                                "required": ["index", "tags", "summary"]
                            }
                        }
                    },
                    "required": ["results"]
                }
            }
        });

        for (key_idx, api_key) in self.api_keys.iter().enumerate() {
            for model in &self.text_models {
                let request_url = format!(
                    "{}/models/{}:generateContent?key={}",
                    GEMINI_BASE_URL, model, api_key
                );

                let response = match self.client.post(&request_url).json(&body).send().await {
                    Ok(res) => res,
                    Err(e) => {
                        tracing::warn!(
                            "Network error for batch model {} (Key {}): {}",
                            model,
                            key_idx,
                            e
                        );
                        continue;
                    }
                };

                let json: serde_json::Value = match response.json().await {
                    Ok(j) => j,
                    Err(_) => continue,
                };

                if let Some(error) = json.get("error") {
                    let code = error["code"].as_i64().unwrap_or(0);
                    let message = error["message"].as_str().unwrap_or("Unknown");

                    if code == 429 || code == 503 || code == 500 {
                        tracing::warn!(
                            "Gemini batch error {} on Key {}. Failing over...",
                            code,
                            key_idx
                        );
                        continue;
                    } else if code == 404
                        || message.contains("is not found")
                        || message.contains("not supported")
                    {
                        continue;
                    } else {
                        anyhow::bail!("Fatal API Error: {}", message);
                    }
                }

                let text = json["candidates"][0]["content"]["parts"][0]["text"]
                    .as_str()
                    .unwrap_or("{}");

                let parsed: RawBatchResult =
                    serde_json::from_str(text).unwrap_or(RawBatchResult { results: vec![] });
                let mut map = std::collections::HashMap::new();
                for item in parsed.results {
                    map.insert(
                        item.index,
                        TagResult {
                            tags: item.tags,
                            summary: item.summary,
                        },
                    );
                }

                if !map.is_empty() {
                    return Ok(map);
                }
            }
        }

        anyhow::bail!("All API keys and text models exhausted. Batch tag generation failed.");
    }

    /// Generate embeddings using fallback matrix (Keys -> Models)
    pub async fn generate_embedding(&self, text: &str) -> anyhow::Result<Vec<f64>> {
        // Loop through API Keys
        for (key_idx, api_key) in self.api_keys.iter().enumerate() {
            // Loop through embedding models
            for model in &self.embedding_models {
                let body = serde_json::json!({
                    "model": format!("models/{}", model),
                    "content": {
                        "parts": [{ "text": text }]
                    }
                });

                let url = format!(
                    "{}/models/{}:embedContent?key={}",
                    GEMINI_BASE_URL, model, api_key
                );

                let response = match self.client.post(&url).json(&body).send().await {
                    Ok(res) => res,
                    Err(e) => {
                        tracing::warn!(
                            "Network error for embedding model {} (Key {}): {}",
                            model,
                            key_idx,
                            e
                        );
                        continue;
                    }
                };

                let json: serde_json::Value = match response.json().await {
                    Ok(j) => j,
                    Err(_) => continue,
                };

                if let Some(error) = json.get("error") {
                    let code = error["code"].as_i64().unwrap_or(0);
                    let message = error["message"].as_str().unwrap_or("Unknown");

                    if code == 429 || code == 503 || code == 500 {
                        tracing::warn!(
                            "Gemini embedding error code {} for model {} on Key {}: {}. Failing over...",
                            code,
                            model,
                            key_idx,
                            message
                        );
                        continue;
                    } else if code == 404
                        || message.contains("is not found")
                        || message.contains("not supported")
                    {
                        tracing::warn!(
                            "Embedding model {} unavailable on this API version (Key {}): {}. Trying next fallback model...",
                            model,
                            key_idx,
                            message
                        );
                        continue;
                    } else {
                        anyhow::bail!("Fatal API Error: {}", message);
                    }
                }

                let values = json["embedding"]["values"]
                    .as_array()
                    .ok_or_else(|| anyhow::anyhow!("Missing embedding values"))?;

                let embedding: Vec<f64> = values.iter().filter_map(|v| v.as_f64()).collect();

                if !embedding.is_empty() {
                    return Ok(embedding);
                }
            }
        }

        anyhow::bail!("All API keys and embedding models exhausted. Embedding generation failed.");
    }
}
