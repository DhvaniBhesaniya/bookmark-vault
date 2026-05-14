# 🔖 Bookmarkvault

Bookmarkvault is an AI-powered bookmark management system built with Rust (Axum), React (Vite + Tailwind), and MongoDB Atlas. It features semantic search, automatic tagging via Gemini, and a robust "Nocturne Noir" dark mode design.

## Features

- **Nocturne Noir Design**: Premium dark mode UI with purple accents and glassmorphism.
- **AI Tagging & Summaries**: Automatically fetches URL metadata and generates smart tags and concise summaries using Gemini 2.5 Flash.
- **Semantic Search**: Vector-based search utilizing Gemini embeddings.
- **Bulk Import**: Import bookmarks from Chrome/Firefox HTML exports with background processing.
- **Full-Stack Performance**: Fast, concurrent Rust backend paired with a snappy React frontend.

## Architecture

- **Frontend**: React, Vite, Tailwind CSS, Radix UI, Framer Motion, Zustand, TanStack Query.
- **Backend**: Rust, Axum, MongoDB Driver, Reqwest, Scraper, Jsonwebtoken, Bcrypt.
- **Database**: MongoDB Atlas.
- **AI Integration**: Google Gemini API.

## Setup Instructions

### Prerequisites

- Node.js & npm
- Rust & Cargo
- MongoDB Atlas cluster
- Google Gemini API Key

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on the required environment variables below.
3. Run the backend:
   ```bash
   cargo run
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the required environment variables below.
4. Run the frontend:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (`backend/.env`)

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=Bookmarkvault
PORT=8080
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## MongoDB Vector Search Index Setup

To enable semantic search, you must manually create a vector search index in the MongoDB Atlas UI:

1. Go to your Atlas Dashboard.
2. Select your Database, then the `Bookmarkvault` database, and the `bookmarks` collection.
3. Go to the "Atlas Search" tab and click "Create Search Index".
4. Choose "Atlas Vector Search - JSON Editor".
5. Name the index `vector_index` (this exact name is required by the backend).
6. Paste the following configuration:

```json
{
  "fields": [
    {
      "numDimensions": 3072,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "user_id",
      "type": "filter"
    }
  ]
}
```

7. Save and wait for the index to build.

## Deployment

This repository includes a `render.yaml` file for deployment to [Render.com](https://render.com).

1. Connect your GitHub repository to Render.
2. Go to "Blueprints" and create a new instance using the `render.yaml` file.
3. Provide the required environment variables when prompted.
4. Update the `CORS_ORIGIN` in the backend service and the `VITE_API_URL` in the frontend service with the generated URLs.

## License

MIT
