#!/bin/bash

# Docker Clean Script for Content Automation API
# Cleans up Docker images, containers, and build cache

set -e

# Configuration
IMAGE_NAME="content-automation-api"
CONTAINER_NAME="content-api"

echo "🧹 Docker Cleanup for Content Automation API"
echo "============================================="

# Stop and remove container
echo ""
echo "🛑 Stopping and removing container..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker stop "${CONTAINER_NAME}" 2>/dev/null || true
    docker rm "${CONTAINER_NAME}" 2>/dev/null || true
    echo "✅ Container '${CONTAINER_NAME}' removed"
else
    echo "ℹ️  Container '${CONTAINER_NAME}' not found"
fi

# Remove images
echo ""
echo "🖼️  Removing images..."
if docker images "${IMAGE_NAME}" --format '{{.Repository}}' | grep -q "${IMAGE_NAME}"; then
    docker rmi $(docker images "${IMAGE_NAME}" -q) 2>/dev/null || true
    echo "✅ Images for '${IMAGE_NAME}' removed"
else
    echo "ℹ️  No images found for '${IMAGE_NAME}'"
fi

# Clean up dangling images
echo ""
echo "🗑️  Cleaning up dangling images..."
DANGLING_IMAGES=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING_IMAGES" ]; then
    docker rmi $DANGLING_IMAGES 2>/dev/null || true
    echo "✅ Dangling images removed"
else
    echo "ℹ️  No dangling images found"
fi

# Clean up build cache
echo ""
echo "💾 Cleaning build cache..."
docker builder prune -f
echo "✅ Build cache cleaned"

# Optional: Clean up unused volumes and networks
read -p "🔄 Clean up unused volumes and networks? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗂️  Cleaning unused volumes..."
    docker volume prune -f
    
    echo "🌐 Cleaning unused networks..."
    docker network prune -f
    
    echo "✅ Volumes and networks cleaned"
fi

# Show disk space saved
echo ""
echo "📊 Current Docker disk usage:"
docker system df

echo ""
echo "✅ Cleanup completed!"
echo "💡 To rebuild: npm run docker:build"
