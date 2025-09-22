#!/bin/bash

# Docker Run Script for Content Automation API
# Runs the Docker container with proper configuration

set -e

# Configuration
IMAGE_NAME="content-automation-api"
TAG="${1:-latest}"
CONTAINER_NAME="content-api"
PORT="${2:-3000}"
FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "🐳 Starting Docker container: ${CONTAINER_NAME}"
echo "📦 Image: ${FULL_IMAGE_NAME}"
echo "🌐 Port: ${PORT}"

# Stop and remove existing container if it exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🛑 Stopping existing container: ${CONTAINER_NAME}"
    docker stop "${CONTAINER_NAME}" || true
    docker rm "${CONTAINER_NAME}" || true
fi

# Run the container
echo "🚀 Starting new container..."
docker run -d \
    --name "${CONTAINER_NAME}" \
    -p "${PORT}:3000" \
    -e NODE_ENV=production \
    -e PORT=3000 \
    --restart unless-stopped \
    "${FULL_IMAGE_NAME}"

echo "✅ Container started successfully!"
echo "📊 Container status:"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🌐 API available at: http://localhost:${PORT}"
echo "🏥 Health check: http://localhost:${PORT}/health"
echo "📋 API info: http://localhost:${PORT}/api"

echo ""
echo "📝 Useful commands:"
echo "   View logs: npm run docker:logs"
echo "   Stop container: npm run docker:stop"
echo "   Container shell: docker exec -it ${CONTAINER_NAME} sh"
