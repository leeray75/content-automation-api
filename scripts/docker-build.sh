#!/bin/bash

# Docker Build Script for Content Automation API
# Builds the Docker image with proper tagging

set -e

# Configuration
IMAGE_NAME="content-automation-api"
TAG="${1:-latest}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "🐳 Building Docker image: ${FULL_IMAGE_NAME}"
echo "📁 Build context: $(pwd)"

# Build the Docker image
docker build -t "${FULL_IMAGE_NAME}" .

echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"
echo "📊 Image size:"
docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "🚀 To run the container:"
echo "   npm run docker:run"
echo "   or"
echo "   docker run -p 3000:3000 ${FULL_IMAGE_NAME}"
