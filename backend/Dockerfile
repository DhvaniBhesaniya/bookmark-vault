# Use the official Rust image as a builder
FROM rust:1.77-slim-bookworm AS builder

# Create a new empty shell project
WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Copy over manifests
COPY Cargo.toml ./

# Copy your source tree
COPY src ./src

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

# Set the startup command to run your binary
CMD ["bookmarkvault-backend"]
