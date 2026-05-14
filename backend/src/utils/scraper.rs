use scraper::{Html, Selector};

#[derive(Debug, Default)]
pub struct PageMetadata {
    pub title: Option<String>,
    pub description: Option<String>,
    pub og_image: Option<String>,
    pub favicon: Option<String>,
    pub domain: Option<String>,
}

/// Fetch metadata from a URL with up to 3 retries and exponential backoff.
pub async fn fetch_metadata(url: &str) -> anyhow::Result<PageMetadata> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (compatible; Bookmarkvault/1.0)")
        .timeout(std::time::Duration::from_secs(12))
        .build()?;

    let mut last_err = anyhow::anyhow!("fetch never attempted");
    for attempt in 0u32..3 {
        if attempt > 0 {
            let delay = std::time::Duration::from_millis(500 * (1 << attempt));
            tokio::time::sleep(delay).await;
        }

        match do_fetch(&client, url).await {
            Ok(meta) => return Ok(meta),
            Err(e) => {
                tracing::warn!("fetch_metadata attempt {} failed for {}: {}", attempt + 1, url, e);
                last_err = e;
            }
        }
    }
    Err(last_err)
}

async fn do_fetch(client: &reqwest::Client, url: &str) -> anyhow::Result<PageMetadata> {
    let response = client.get(url).send().await?;
    let final_url = response.url().clone();
    let html = response.text().await?;
    let document = Html::parse_document(&html);

    let domain = final_url.host_str().map(|h| h.replace("www.", ""));

    // Title: og:title > twitter:title > <title>
    let scraped_title = extract_meta(&document, "og:title")
        .or_else(|| extract_meta(&document, "twitter:title"))
        .or_else(|| {
            let sel = Selector::parse("title").ok()?;
            document.select(&sel).next().map(|e| e.text().collect::<String>().trim().to_string())
        });

    // Use the scraped title if it's meaningful, otherwise fall back to path-based title
    let title = match scraped_title {
        Some(ref t) if !is_low_quality_title(t, domain.as_deref()) => scraped_title,
        _ => {
            // Try to build a readable title from the URL path
            title_from_url_path(&final_url).or(scraped_title)
        }
    };

    // Description: og:description > twitter:description > meta[name=description]
    let description = extract_meta(&document, "og:description")
        .or_else(|| extract_meta(&document, "twitter:description"))
        .or_else(|| extract_meta_name(&document, "description"));

    // OG Image
    let og_image = extract_meta(&document, "og:image");

    // Favicon
    let favicon = extract_favicon(&document)
        .or_else(|| {
            let base = format!("{}://{}", final_url.scheme(), final_url.host_str()?);
            Some(format!("{}/favicon.ico", base))
        });

    Ok(PageMetadata { title, description, og_image, favicon, domain })
}

/// Returns `true` when a title is too generic to be useful.
pub fn is_low_quality_title(title: &str, domain: Option<&str>) -> bool {
    let t = title.trim();
    if t.is_empty() || t.len() < 4 {
        return true;
    }
    // Matches domain name (with or without TLD)
    if let Some(d) = domain {
        let d_lower = d.to_lowercase();
        let t_lower = t.to_lowercase();
        if t_lower == d_lower
            || t_lower == d.split('.').next().unwrap_or("").to_lowercase()
        {
            return true;
        }
    }
    // Generic single-word page titles
    let generic: &[&str] = &[
        "home", "index", "untitled", "untitled document",
        "404", "403", "not found", "error", "loading",
        "please wait", "redirecting", "just a moment",
        "attention required", "access denied", "processing...",
    ];
    let t_lower = t.to_lowercase();
    if generic.iter().any(|&g| t_lower == g) {
        return true;
    }
    false
}

/// Attempt to produce a human-readable title from the URL path.
/// e.g. "/blog/my-interesting-post" → "My Interesting Post"
pub fn title_from_url_path(url: &url::Url) -> Option<String> {
    let path = url.path().trim_end_matches('/');
    if path.is_empty() || path == "/" {
        return None;
    }
    let last_segment = path.split('/').filter(|s| !s.is_empty()).last()?;
    // Strip common file extensions
    let stem = last_segment
        .rsplit_once('.')
        .map(|(s, _)| s)
        .unwrap_or(last_segment);
    if stem.is_empty() {
        return None;
    }
    // Replace hyphens/underscores with spaces and title-case
    let readable = stem
        .replace(['-', '_'], " ")
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ");
    if readable.len() >= 4 {
        Some(readable)
    } else {
        None
    }
}

fn extract_meta(doc: &Html, property: &str) -> Option<String> {
    let selector = Selector::parse(&format!("meta[property=\"{}\"]", property)).ok()?;
    doc.select(&selector).next()?.value().attr("content").map(|s| s.trim().to_string())
}

fn extract_meta_name(doc: &Html, name: &str) -> Option<String> {
    let selector = Selector::parse(&format!("meta[name=\"{}\"]", name)).ok()?;
    doc.select(&selector).next()?.value().attr("content").map(|s| s.trim().to_string())
}

fn extract_favicon(doc: &Html) -> Option<String> {
    let selector = Selector::parse("link[rel~=\"icon\"]").ok()?;
    doc.select(&selector).next()?.value().attr("href").map(|s| s.trim().to_string())
}
