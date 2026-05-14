# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder
WORKDIR /usr/src/app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Rust backend
FROM rust:1.88-slim-bookworm AS builder

# Create a new empty shell project
WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy over manifests
COPY backend/Cargo.toml ./

# Copy your source tree
COPY backend/src ./src

# Build for release
RUN cargo build --release

# Final base image
FROM debian:bookworm-slim

# Install runtime dependencies (OpenSSL is needed for reqwest/mongodb)
RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

# Copy the build artifact from the builder stage
COPY --from=builder /usr/src/app/target/release/bookmarkvault-backend /usr/local/bin/bookmarkvault-backend

# Copy the frontend dist from the frontend builder
COPY --from=frontend-builder /usr/src/app/frontend/dist /usr/local/share/frontend/dist

# Set the startup command to run your binary
CMD ["bookmarkvault-backend"]
