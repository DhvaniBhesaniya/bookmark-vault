# 🔖 Bookmarkvault — Antigravity Agent Build Brief
> **Version:** 1.0 | **Date:** May 2026 | **Stack:** Rust + MongoDB + Gemini + React JSX + Render

---

## 🧠 Agent Instructions — Read Before Anything Else

You are building **Bookmarkvault** — a personal AI-powered bookmark intelligence system.

Follow this **exact build order**:

1. **STEP 0** → Use Stitch MCP to design all UI screens
2. **STEP 1** → Extract Design DNA from Stitch and scaffold React project
3. **STEP 2** → Build the full React JSX frontend
4. **STEP 3** → Build the Rust + Axum backend
5. **STEP 4** → Set up MongoDB Atlas connection + Vector Search index
6. **STEP 5** → Wire Gemini AI (tagging + embeddings)
7. **STEP 6** → Configure Render deployment

**Never skip STEP 0.** Stitch MCP is connected. Use it to generate all screen designs before writing a single line of frontend code.

---

## 📋 Project Overview

| Property | Value |
|---|---|
| **Project Name** | Bookmarkvault |
| **Type** | Personal bookmark manager with AI semantic search |
| **Users** | Single user (personal use) |
| **Deployment** | Render.com (backend web service + static frontend) |
| **Database** | MongoDB Atlas (free tier, M0 cluster) |
| **AI Provider** | Google Gemini API |
| **Repo Structure** | Monorepo (`/backend` + `/frontend`) |

### What it does

- Import Chrome/Firefox bookmarks in one click (HTML export file)
- Auto-fetch page metadata (title, description, favicon, OG image) for every link
- Auto-tag and summarize every bookmark using Gemini AI (zero manual work)
- Store vector embeddings for semantic search
- Search by meaning: "free pdf editor" finds the right tools even without exact title match
- Save any link manually + add notes, type `link | note | image`
- Filter by tag, domain, date, type
- Browser extension for one-click save from any page

---

## 🎨 STEP 0 — Stitch MCP: Design All Screens First

> Stitch MCP is already connected. Use it to generate high-fidelity UI screens before writing frontend code.

### Stitch Prompts — Run These In Order

For each screen, use the Stitch MCP tool to generate the design. Then extract the Design DNA before writing any React code.

---

**Screen 1: Login / Register Page**
```
Design a clean, dark-themed login page for a personal bookmark manager called "Bookmarkvault". 
Dark background (#0a0a0f), subtle noise texture. Center-aligned card with glowing border. 
Logo: bookmark icon + "Bookmarkvault" in serif font. 
Fields: Email, Password. 
Buttons: "Sign In" (filled accent purple), "Create Account" (ghost). 
Minimal, luxurious feel. No illustrations. Subtle gradient mesh background.
```

---

**Screen 2: Home / Search Page (Main View)**
```
Design the main dashboard for "Bookmarkvault" — a personal AI bookmark manager. 
Dark theme. Top: logo left, user avatar right. 
Center: large command-palette style search bar with "⌘K Search your bookmarks..." placeholder and subtle glow on focus. 
Below search: filter pills row (All, Links, Notes, Images, Favorites + tag chips). 
Main area: responsive card grid (3 cols desktop, 2 tablet, 1 mobile). 
Each card: favicon top-left, OG image if available, title, 2-line AI summary, tag badges, domain + "2 days ago". 
Hover state: soft glow border, quick action icons appear (open, edit, delete, star). 
Left sidebar: Tags list with counts. Collapsible. Dark, minimal.
```

---

**Screen 3: Import Page**
```
Design an import page for a bookmark manager. 
Dark theme. Large drag-and-drop zone center: dashed border, bookmark icon, "Drop your Chrome or Firefox bookmark HTML file here" text, "or browse file" link. 
Below zone: step-by-step instructions (3 steps with numbered icons): 1. Export from browser, 2. Drop file here, 3. AI processes everything. 
After file selected: show progress bar, "Processing 847 bookmarks... 342 done" with animated shimmer. 
Live preview: small cards appearing as they're processed. 
Success state: confetti + "847 bookmarks imported! Start searching." button.
```

---

**Screen 4: Bookmark Detail (Side Sheet)**
```
Design a slide-in side panel (sheet) for viewing a single bookmark in detail.
Dark theme. Right side panel, 480px wide, full height.
Top: close button (X), bookmark favicon + title as header.
Sections: URL (clickable), AI Summary (card with sparkle icon), Tags (editable badge list), 
User Notes (textarea), OG Image preview, Domain, Date saved.
Bottom: Delete button (red, ghost), Save Changes button (accent purple filled).
Smooth slide-in animation from right.
```

---

**Screen 5: Command Palette (⌘K)**
```
Design a command palette modal for a bookmark manager.
Dark, floating card centered, 600px wide, keyboard-driven.
Search input at top with magnifier icon. 
Results list below: each result has favicon, title, AI summary snippet, tag badges.
Keyboard hints: ↑↓ navigate, Enter open, Esc close.
Recent searches section when input empty.
Subtle backdrop blur behind the palette.
```

---

**Screen 6: Settings Page**
```
Design a settings page for a personal bookmark manager.
Dark theme. Left nav: sections (Account, Import/Export, API Keys, Appearance).
Account section: email display, change password form.
API Keys section: "Gemini API Key" input with show/hide toggle and test button.
Appearance: dark/light mode toggle, accent color picker (5 options).
Import/Export: import button, export as JSON/HTML buttons.
Clean, organized, form-heavy layout.
```

---

### After Stitch Generates Screens

Once all 6 screens are designed in Stitch, run this in the Antigravity Agent Tab:

```
Fetch the Design DNA from my Stitch project for all 6 screens.
Extract: color palette, typography (font families, sizes, weights), spacing scale, 
border radius values, shadow styles, component patterns.
Save the output as frontend/DESIGN.md
Then scaffold a new Vite + React + Tailwind project in the /frontend directory 
using these exact design tokens.
```

---

## 🗂️ Project File Structure

```
bookmar-vault/
├── backend/                          ← Rust (Axum)
│   ├── src/
│   │   ├── main.rs                   ← Server entry point, router setup
│   │   ├── config.rs                 ← Env var loading (MongoDB URI, Gemini key, JWT secret)
│   │   ├── db.rs                     ← MongoDB client initialization
│   │   ├── errors.rs                 ← AppError enum, unified error responses
│   │   ├── middleware/
│   │   │   └── auth.rs               ← JWT extraction middleware
│   │   ├── models/
│   │   │   ├── bookmark.rs           ← Bookmark struct (serde + bson)
│   │   │   ├── user.rs               ← User struct
│   │   │   └── collection.rs         ← Collection struct
│   │   ├── routes/
│   │   │   ├── mod.rs                ← Route aggregation
│   │   │   ├── auth.rs               ← POST /auth/register, /auth/login
│   │   │   ├── bookmarks.rs          ← CRUD + import endpoint
│   │   │   ├── search.rs             ← GET /search?q=...
│   │   │   └── collections.rs        ← Collection CRUD
│   │   └── services/
│   │       ├── gemini.rs             ← Gemini API calls (tagging + embeddings)
│   │       ├── scraper.rs            ← URL metadata fetch (reqwest + scraper)
│   │       └── import.rs             ← Browser HTML bookmark parser
│   ├── Cargo.toml
│   └── Dockerfile
│
├── frontend/                         ← React (Vite + JSX)
│   ├── DESIGN.md                     ← Stitch Design DNA (auto-generated)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── main.jsx                  ← React DOM entry
│   │   ├── App.jsx                   ← Router setup
│   │   ├── index.css                 ← Tailwind directives + CSS variables
│   │   ├── lib/
│   │   │   ├── api.js                ← Axios instance with JWT interceptor
│   │   │   ├── utils.js              ← cn(), formatDate(), etc.
│   │   │   └── constants.js          ← API_URL, etc.
│   │   ├── store/
│   │   │   └── useAuthStore.js       ← Zustand: user session, JWT token
│   │   ├── hooks/
│   │   │   ├── useBookmarks.js       ← TanStack Query: bookmark fetch/mutate
│   │   │   ├── useSearch.js          ← Debounced semantic search hook
│   │   │   └── useImport.js          ← File import + progress polling
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── HomePage.jsx          ← Main search + grid view
│   │   │   ├── ImportPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── components/
│   │   │   ├── ui/                   ← shadcn/ui primitives (copy-pasted)
│   │   │   │   ├── button.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── badge.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── sheet.jsx
│   │   │   │   ├── toast.jsx
│   │   │   │   ├── skeleton.jsx
│   │   │   │   ├── progress.jsx
│   │   │   │   ├── tooltip.jsx
│   │   │   │   └── dropdown-menu.jsx
│   │   │   ├── BookmarkCard.jsx      ← Individual bookmark card
│   │   │   ├── BookmarkGrid.jsx      ← Masonry/grid layout
│   │   │   ├── BookmarkDetail.jsx    ← Side sheet detail view
│   │   │   ├── SearchBar.jsx         ← Main search input
│   │   │   ├── CommandPalette.jsx    ← ⌘K modal (cmdk)
│   │   │   ├── TagFilter.jsx         ← Filter pills + tag sidebar
│   │   │   ├── ImportDropzone.jsx    ← Drag-drop import zone
│   │   │   ├── ImportProgress.jsx    ← Live import progress
│   │   │   └── Navbar.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── render.yaml                       ← Render deployment config
└── README.md
```

---

## ⚙️ Tech Stack — Exact Versions & Libraries

### Backend (Rust)

**`Cargo.toml` dependencies:**

```toml
[package]
name = "Bookmarkvault-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = { version = "0.7", features = ["multipart"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
mongodb = { version = "3", features = ["bson-chrono-0_4"] }
bson = { version = "2", features = ["chrono-0_4"] }
chrono = { version = "0.4", features = ["serde"] }
jsonwebtoken = "9"
bcrypt = "0.15"
reqwest = { version = "0.12", features = ["json", "cookies"] }
scraper = "0.19"
url = "2"
uuid = { version = "1", features = ["v4", "serde"] }
tokio-stream = "0.1"
anyhow = "1"
thiserror = "1"
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = "0.3"
regex = "1"
html5ever = "0.27"
markup5ever_rcdom = "0.3"
```

### Frontend (React)

**`package.json` dependencies:**

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.28.0",
    "zustand": "^4.5.0",
    "axios": "^1.6.0",
    "cmdk": "^1.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.363.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@radix-ui/react-sheet": "^1.0.5",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-badge": "^1.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-switch": "^1.0.3",
    "framer-motion": "^11.0.0",
    "react-dropzone": "^14.2.0",
    "date-fns": "^3.3.0",
    "sonner": "^1.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.1.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🎨 UI Component Sources

Use components from these 3 sources alongside shadcn/ui. Pick the best component for each UI need:

### 1. UIverse.io — `https://uiverse.io`
Best for: Animated buttons, toggle switches, loaders, cards with hover effects, input fields with glow effects.

**Use from UIverse:**
- Search input with animated glow border → `SearchBar.jsx`
- Animated loading skeleton cards → bookmark card loading state
- Toggle switch for dark mode → `SettingsPage.jsx`
- Shimmer/pulse animation CSS → import progress cards
- Star/favorite button with animation → `BookmarkCard.jsx`

**How to use:** Copy the HTML/CSS from UIverse, convert to JSX (className instead of class), integrate Tailwind tokens.

### 2. Untitled UI — `https://www.untitledui.com/react/components`
Best for: Production-grade React components with clean design system. Badges, dropdowns, modal sheets, form elements, navigation.

**Use from Untitled UI:**
- Badge component → tag chips on bookmark cards
- Dropdown menu → bookmark card action menu (edit, delete, open)
- Side sheet / drawer → `BookmarkDetail.jsx`
- Empty state illustration + message → when no search results
- Notification toast → save success, import complete
- Command menu pattern → `CommandPalette.jsx`
- Filter chips → tag filter row on `HomePage.jsx`

**How to use:** These are React components. Copy and adapt to match the Stitch Design DNA color tokens.

### 3. Magic UI — `https://magicui.design`
Best for: Animated components, special effects, landing elements, hero sections.

**Use from Magic UI:**
- `AnimatedBeam` or `SparklesText` → "Bookmarkvault" logo/header text
- `ShimmerButton` → primary "Import Bookmarks" CTA button
- `MagicCard` → bookmark cards with hover gradient border effect
- `BorderBeam` → animated border on search input focus
- `BlurFade` → staggered reveal animation when search results load
- `TypingAnimation` → search bar placeholder cycling text
- `NumberTicker` → "847 bookmarks imported" count animation on import success
- `Particles` or `Confetti` → import success celebration
- `AnimatedGridPattern` → subtle background texture on login page

**How to use:** Install via npm (`npx magicui-cli add <component>`) or copy from the docs. These are drop-in React components.

### Component Allocation Summary

| Component | Source |
|---|---|
| `SearchBar` with glow | UIverse glow input + Magic UI `BorderBeam` |
| `BookmarkCard` | Magic UI `MagicCard` + Untitled UI Badge |
| `CommandPalette` | shadcn/ui cmdk + Untitled UI command pattern |
| `BookmarkDetail` sheet | Untitled UI side sheet |
| `ImportDropzone` | react-dropzone + UIverse drag-drop CSS |
| `ImportProgress` | Magic UI `NumberTicker` + shadcn Progress |
| Login page | Magic UI `AnimatedGridPattern` bg + shadcn Card |
| Tags sidebar | Untitled UI filter chips |
| Toast notifications | Sonner (already in deps) |
| Navbar | Custom + lucide-react icons |
| Empty state | Untitled UI empty state |
| Success animation | Magic UI `Confetti` or `NumberTicker` |

---

## 🗄️ MongoDB Data Models

### Collection: `bookmarks`

```rust
// backend/src/models/bookmark.rs

use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bookmark {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: ObjectId,
    
    // Type of item
    #[serde(rename = "type")]
    pub item_type: BookmarkType,
    
    // Content
    pub url: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub favicon: Option<String>,
    pub og_image: Option<String>,
    pub domain: Option<String>,
    
    // AI-generated fields
    pub tags: Vec<String>,
    pub ai_summary: Option<String>,
    
    // User fields
    pub notes: Option<String>,
    pub is_favorite: bool,
    pub collection_id: Option<ObjectId>,
    
    // Vector for semantic search (768 dimensions from text-embedding-004)
    pub embedding: Option<Vec<f64>>,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum BookmarkType {
    Link,
    Note,
    Image,
}
```

### Collection: `users`

```rust
// backend/src/models/user.rs

use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
}

// Request structs (no serde bson needed)
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub email: String,
}
```

### MongoDB Indexes to Create

```javascript
// Run these in MongoDB Atlas → Collections → Indexes

// 1. Unique email index on users
db.users.createIndex({ "email": 1 }, { unique: true })

// 2. Bookmark queries by user
db.bookmarks.createIndex({ "user_id": 1, "created_at": -1 })

// 3. Full-text search fallback
db.bookmarks.createIndex({ 
  "title": "text", 
  "description": "text", 
  "tags": "text", 
  "ai_summary": "text" 
})

// 4. Vector Search index (create via Atlas UI → Search → Create Index)
// Collection: bookmarks
// Index name: vector_index
// JSON config:
{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 768,
    "similarity": "cosine"
  }]
}
```

---

## 🔌 Backend API — Full Specification

Base URL: `https://Bookmarkvault-backend.onrender.com/api/v1`

All protected routes require: `Authorization: Bearer <JWT_TOKEN>`

---

### Auth Routes

#### `POST /api/v1/auth/register`
**Body:**
```json
{ "email": "user@example.com", "password": "securepassword123" }
```
**Response 201:**
```json
{ "token": "eyJ...", "email": "user@example.com" }
```
**Logic:** Hash password with bcrypt (cost 12) → insert user → return JWT

---

#### `POST /api/v1/auth/login`
**Body:**
```json
{ "email": "user@example.com", "password": "securepassword123" }
```
**Response 200:**
```json
{ "token": "eyJ...", "email": "user@example.com" }
```

---

### Bookmark Routes (all protected)

#### `GET /api/v1/bookmarks`
**Query params:** `page=1&limit=20&type=link&tag=rust&domain=github.com&favorite=true`

**Response 200:**
```json
{
  "bookmarks": [ /* array of Bookmark objects */ ],
  "total": 847,
  "page": 1,
  "limit": 20
}
```

---

#### `POST /api/v1/bookmarks`
**Body:**
```json
{
  "url": "https://github.com/tokio-rs/axum",
  "type": "link",
  "notes": "Great Rust web framework"
}
```

**Logic (async pipeline — respond immediately, process in background):**
1. Save bookmark with status `processing`
2. Spawn Tokio task:
   a. Fetch URL metadata (title, description, favicon, og_image, domain)
   b. Call Gemini `gemini-2.5-flash-lite` for tags + summary
   c. Call Gemini `text-embedding-004` for 768-dim embedding
   d. Update document in MongoDB with all fields + status `ready`
3. Return saved bookmark immediately with `status: "processing"`

**Response 201:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "url": "https://github.com/tokio-rs/axum",
  "title": "Processing...",
  "status": "processing"
}
```

---

#### `GET /api/v1/bookmarks/:id` → Returns full Bookmark object

#### `PUT /api/v1/bookmarks/:id`
**Body (partial update — all fields optional):**
```json
{
  "title": "Updated title",
  "notes": "My notes here",
  "tags": ["rust", "web", "axum"],
  "is_favorite": true,
  "collection_id": "507f1f77bcf86cd799439011"
}
```

#### `DELETE /api/v1/bookmarks/:id` → 204 No Content

---

#### `POST /api/v1/bookmarks/import`
**Content-Type:** `multipart/form-data`
**Field:** `file` — Chrome/Firefox bookmark HTML export

**Logic:**
1. Parse HTML file using `scraper` crate — extract all `<a href>` links with titles
2. Save all as bookmarks with status `queued`
3. Return job ID immediately
4. Background: process in batches of 10, calling Gemini for each
5. Update progress in a `import_jobs` collection

**Response 202:**
```json
{ "job_id": "abc123", "total": 847 }
```

---

#### `GET /api/v1/bookmarks/import/status/:job_id`
**Response:**
```json
{
  "job_id": "abc123",
  "total": 847,
  "processed": 342,
  "status": "running",
  "percent": 40
}
```
Frontend polls this every 2 seconds during import.

---

### Search Route (protected)

#### `GET /api/v1/search?q=pdf+editor&limit=20`

**Logic:**
1. Call Gemini `text-embedding-004` to embed the query string → 768-dim vector
2. Run MongoDB `$vectorSearch` aggregation on `bookmarks` collection:
   - `index: "vector_index"`
   - `path: "embedding"`
   - `queryVector: [query embedding]`
   - `numCandidates: 100`
   - `limit: 20`
   - `filter: { user_id: <current user> }`
3. Re-rank: boost score if title/tags also contain query words (hybrid scoring)
4. Return ranked results with similarity score

**Response 200:**
```json
{
  "results": [
    {
      "bookmark": { /* full Bookmark object */ },
      "score": 0.94
    }
  ],
  "query": "pdf editor",
  "count": 15
}
```

---

#### `GET /api/v1/search/tags` — Returns all unique tags with counts
```json
{ "tags": [{ "name": "rust", "count": 34 }, { "name": "react", "count": 28 }] }
```

---

### Collections Routes (protected)

```
GET    /api/v1/collections        → list all collections
POST   /api/v1/collections        → create collection { "name": "Rust Learning", "color": "#7c6af7" }
PUT    /api/v1/collections/:id    → update name/color
DELETE /api/v1/collections/:id   → delete (bookmarks remain, collection_id set to null)
```

---

## 🤖 Gemini AI Integration

### Service File: `backend/src/services/gemini.rs`

**Two models used:**

| Model | Purpose | API Endpoint |
|---|---|---|
| `gemini-2.5-flash-lite` | Generate tags + summary | `generateContent` |
| `text-embedding-004` | Generate 768-dim vector | `embedContent` |

**Base URL:** `https://generativelanguage.googleapis.com/v1beta`

---

### Tagging Prompt (send to `gemini-2.5-flash-lite`)

```rust
let prompt = format!(r#"
You are a bookmark tagging assistant. Given a webpage, return ONLY a valid JSON object with no markdown, no preamble.

Return exactly this structure:
{{
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "One to two sentence plain English summary of what this page is about."
}}

Rules for tags:
- 5 to 8 tags maximum
- All lowercase, no spaces (use hyphens: "open-source" not "open source")  
- Be specific: "rust-async" not just "programming"
- Include: topic, tool-type, use-case, language/framework if relevant

Webpage info:
Title: {}
Description: {}
URL: {}
"#, title, description, url);
```

---

### Embedding Call (send to `text-embedding-004`)

```rust
// Combine relevant text fields for richest embedding
let text_to_embed = format!(
    "{} {} {} {}", 
    title, 
    summary.unwrap_or_default(), 
    tags.join(" "), 
    description.unwrap_or_default()
);

// API call to:
// POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
// Body: { "content": { "parts": [{ "text": "<text_to_embed>" }] } }
// Returns: { "embedding": { "values": [0.023, -0.041, ...] } } ← 768 floats
```

---

### URL Metadata Scraper: `backend/src/services/scraper.rs`

```rust
// Fields to extract from any URL:
pub struct PageMetadata {
    pub title: Option<String>,          // <title> or og:title
    pub description: Option<String>,    // og:description or meta description
    pub og_image: Option<String>,       // og:image
    pub favicon: Option<String>,        // <link rel="icon"> or /favicon.ico fallback
    pub domain: Option<String>,         // extracted from URL
}

// Priority order for title: og:title > twitter:title > <title>
// Priority order for description: og:description > twitter:description > meta[name=description]
// Favicon fallback: if no <link rel="icon">, try https://domain.com/favicon.ico
// Set User-Agent: "Mozilla/5.0 Bookmarkvault/1.0" to avoid bot blocks
// Timeout: 10 seconds max per request
// On fetch error: return metadata with title = URL, all others None
```

---

### Bookmark HTML Parser: `backend/src/services/import.rs`

```rust
// Chrome/Firefox bookmark HTML structure:
// <DT><A HREF="https://..." ADD_DATE="...">Page Title</A>
// Parse with scraper crate:
// - Select all <a> tags
// - Extract href attribute → url
// - Extract text content → title  
// - Extract ADD_DATE attribute → created_at (Unix timestamp)
// - Skip javascript:, data:, and about: URLs
// Return Vec<(url, title, timestamp)>
```

---

## 🖥️ Frontend — Key Components Implementation

### `SearchBar.jsx` — The centerpiece UI

```jsx
// Uses Magic UI BorderBeam on focus
// UIverse glow input CSS for the input element
// Debounced: wait 300ms after typing stops before calling API
// Keyboard: Escape clears search, ⌘K focuses from anywhere
// Shows: result count "15 results for 'pdf editor'"
// Placeholder cycles: "Search bookmarks...", "Try 'rust tutorials'", "Try 'free tools'"
```

### `BookmarkCard.jsx` — Core display unit

```jsx
// Magic UI MagicCard wrapper (hover gradient border)
// Layout:
//   - Top: favicon (16x16) + domain text (right-aligned: "2 days ago")
//   - OG Image if available (16:9, lazy loaded, fallback gradient)  
//   - Title: 2 lines max, font-semibold, truncate
//   - AI Summary: 2 lines, text-muted, text-sm
//   - Tags: Untitled UI Badge components, max 3 visible + "+N more"
// Hover state:
//   - Quick action row appears (framer-motion fadeIn):
//     Open ↗, Edit ✏, Star ★, Delete 🗑
// Click card body: opens BookmarkDetail sheet
// Click title/domain: opens URL in new tab
```

### `CommandPalette.jsx` — ⌘K modal

```jsx
// Uses cmdk library
// Trigger: document keydown ⌘K or Ctrl+K
// Features:
//   - Instant search as user types
//   - Results: favicon + title + summary snippet
//   - Keyboard nav: ↑↓ move, Enter open link, Esc close
//   - Sections: "Recent" (last 5 opened) + "Results"
//   - Empty state: "No bookmarks found for '...'"
// Backdrop: fixed overlay with blur
```

### `ImportDropzone.jsx` — File drop zone

```jsx
// Uses react-dropzone
// Accept: .html only
// States:
//   - idle: dashed border, upload icon, instructions
//   - drag-over: border color changes, "Drop it!" text
//   - processing: replaced by ImportProgress component
//   - success: Magic UI NumberTicker count + "Start Searching" button
// On file drop: call POST /api/v1/bookmarks/import (multipart)
// Then: poll GET /api/v1/bookmarks/import/status/:job_id every 2s
```

---

## 🔐 Auth & JWT

```rust
// JWT payload (Claims struct):
// { "sub": "user_id", "email": "user@example.com", "exp": <unix_timestamp> }
// Expiry: 30 days
// Secret: from JWT_SECRET env var (generate with: openssl rand -base64 64)
// Algorithm: HS256

// Middleware: extract Bearer token from Authorization header
// Inject user_id into request extensions for all protected routes
// Return 401 if token missing, expired, or invalid
```

---

## 🌍 Environment Variables

### Backend (`.env` in /backend)

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/Bookmarkvault?retryWrites=true&w=majority
DATABASE_NAME=Bookmarkvault

# Gemini AI
GEMINI_API_KEY=AIza...

# JWT
JWT_SECRET=<generate with: openssl rand -base64 64>

# Server
PORT=8080
CORS_ORIGIN=https://Bookmarkvault-frontend.onrender.com
# For local dev: CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env` in /frontend)

```env
VITE_API_URL=https://Bookmarkvault-backend.onrender.com/api/v1
# For local dev: VITE_API_URL=http://localhost:8080/api/v1
```

---

## 🐳 Dockerfile (Backend)

```dockerfile
# backend/Dockerfile

# Stage 1: Build
FROM rust:1.76-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
# Cache dependencies layer
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY src ./src
RUN cargo build --release

# Stage 2: Runtime
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/Bookmarkvault-backend .
EXPOSE 8080
CMD ["./Bookmarkvault-backend"]
```

---

## 🚀 Render Deployment Config

```yaml
# render.yaml (repo root)

services:
  # ── Rust Backend ──
  - type: web
    name: Bookmarkvault-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: DATABASE_NAME
        value: Bookmarkvault
      - key: PORT
        value: 8080
      - key: CORS_ORIGIN
        value: https://Bookmarkvault-frontend.onrender.com
    healthCheckPath: /health

  # ── React Frontend ──
  - type: static
    name: Bookmarkvault-frontend
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    plan: free
    envVars:
      - key: VITE_API_URL
        value: https://Bookmarkvault-backend.onrender.com/api/v1
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 🏥 Backend Health Check

Add this route in `main.rs` (no auth required, Render uses it):

```rust
// GET /health → 200 OK { "status": "ok" }
async fn health_check() -> impl IntoResponse {
    axum::Json(serde_json::json!({ "status": "ok" }))
}
```

---

## 📐 UI Design Tokens (apply from Stitch DESIGN.md)

Until Stitch generates the exact DESIGN.md, use these as base tokens:

```css
/* frontend/src/index.css */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-tertiary: #18181f;
  --border: rgba(255, 255, 255, 0.07);
  --border-hover: rgba(255, 255, 255, 0.13);
  --text-primary: #e8e6f0;
  --text-secondary: #7a7890;
  --text-tertiary: #3e3c50;
  --accent: #7c6af7;
  --accent-light: #a78bfa;
  --accent-glow: rgba(124, 106, 247, 0.15);
  --success: #34d399;
  --warning: #fbbf24;
  --danger: #f87171;
  --radius: 10px;
  --radius-lg: 16px;
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

/* Override with Stitch DESIGN.md tokens once generated */
```

**Tailwind config extend:**

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a0f', secondary: '#111118', tertiary: '#18181f' },
        accent: { DEFAULT: '#7c6af7', light: '#a78bfa' },
        border: { DEFAULT: 'rgba(255,255,255,0.07)', hover: 'rgba(255,255,255,0.13)' },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
```

---

## ✅ Build Checklist for Agent

### Phase 1 — Stitch + Project Scaffold
- [ ] Generate all 6 Stitch screen designs using prompts above
- [ ] Extract Design DNA via Stitch MCP → save as `frontend/DESIGN.md`
- [ ] Init Vite React project in `/frontend`
- [ ] Install all frontend dependencies from `package.json` above
- [ ] Configure Tailwind + apply design tokens
- [ ] Install Magic UI components: `ShimmerButton`, `MagicCard`, `BorderBeam`, `BlurFade`, `NumberTicker`
- [ ] Set up shadcn/ui components listed in file structure

### Phase 2 — React Frontend
- [ ] `App.jsx` with React Router v6 routes (/, /import, /settings, /login)
- [ ] `useAuthStore` with Zustand (token, user, login, logout)
- [ ] Axios instance with JWT interceptor in `lib/api.js`
- [ ] `LoginPage.jsx` (register/login tabs)
- [ ] `Navbar.jsx`
- [ ] `SearchBar.jsx` with debounce + Magic UI BorderBeam
- [ ] `CommandPalette.jsx` with cmdk
- [ ] `BookmarkCard.jsx` with Magic UI MagicCard + Untitled UI Badge
- [ ] `BookmarkGrid.jsx` with skeleton loaders
- [ ] `BookmarkDetail.jsx` side sheet
- [ ] `TagFilter.jsx` sidebar + filter pills
- [ ] `HomePage.jsx` assembling all above
- [ ] `ImportDropzone.jsx` + `ImportProgress.jsx`
- [ ] `ImportPage.jsx`
- [ ] `SettingsPage.jsx`
- [ ] `useSearch.js`, `useBookmarks.js`, `useImport.js` hooks

### Phase 3 — Rust Backend
- [ ] `main.rs` — Axum server, CORS, router, tracing
- [ ] `config.rs` — env var loading
- [ ] `db.rs` — MongoDB client init
- [ ] `errors.rs` — unified AppError → HTTP response
- [ ] `middleware/auth.rs` — JWT extraction
- [ ] `models/` — all structs with serde
- [ ] `routes/auth.rs` — register + login
- [ ] `routes/bookmarks.rs` — CRUD + import
- [ ] `routes/search.rs` — semantic search
- [ ] `services/scraper.rs` — URL metadata fetch
- [ ] `services/gemini.rs` — tagging + embedding calls
- [ ] `services/import.rs` — HTML bookmark parser
- [ ] `Dockerfile` — multi-stage build
- [ ] Health check endpoint `GET /health`

### Phase 4 — Database + Deployment
- [ ] Create MongoDB Atlas M0 cluster (free)
- [ ] Create database `Bookmarkvault`
- [ ] Create collections: `users`, `bookmarks`, `import_jobs`
- [ ] Create all indexes (see MongoDB Indexes section above)
- [ ] Create Vector Search index `vector_index` on `bookmarks.embedding`
- [ ] Get MongoDB connection string
- [ ] Set up Gemini API key in Google AI Studio
- [ ] Create `render.yaml` in repo root
- [ ] Push to GitHub repo
- [ ] Connect repo to Render → deploy backend + frontend
- [ ] Set all env vars in Render dashboard

---

## 🔗 External Service Setup Links

| Service | URL | What to do |
|---|---|---|
| MongoDB Atlas | https://cloud.mongodb.com | Create free M0 cluster → get connection string |
| Gemini API Key | https://aistudio.google.com/apikey | Create API key (free tier) |
| Google Cloud Billing | https://console.cloud.google.com/billing | Add billing account (required for Gemini, won't charge for personal use volumes) |
| Render | https://render.com | Connect GitHub → deploy via render.yaml |
| Google Stitch | https://stitch.withgoogle.com | Create Stitch project → design all 6 screens |

---

## 📎 Notes for Agent

1. **Stitch first, code second.** Never start writing React UI without fetching the Stitch Design DNA first. The entire design system comes from Stitch.

2. **Bookmark processing is async.** When saving a URL, respond immediately with `status: "processing"`. The Gemini tagging + embedding happens in a background Tokio task. Frontend polls for status.

3. **Import is bulk + async.** The import endpoint accepts the HTML file, parses it immediately, returns a job_id, and processes bookmarks in background batches of 10. Frontend polls import status every 2 seconds.

4. **Semantic search requires Vector Search index.** This MUST be created manually in MongoDB Atlas UI before search will work. It cannot be created via the Rust driver.

5. **CORS must be configured correctly.** The Rust backend must allow requests from the Render frontend URL. Use `tower-http` CORS layer.

6. **Render free tier sleeps.** The backend sleeps after 15 minutes. This is acceptable for personal use. First request after sleep takes ~10 seconds. Frontend should show a loading state gracefully.

7. **Component adaptation.** When using UIverse or Untitled UI components, convert `class=""` to `className=""`, convert inline styles to Tailwind classes where possible, and apply the Stitch design tokens (colors, fonts, radius) from `DESIGN.md`.

8. **Magic UI installation.** Run `npx magicui-cli add magic-card` etc. for each Magic UI component. They copy into `src/components/magicui/`.

---

*End of Agent Brief — Bookmarkvault v1.0*