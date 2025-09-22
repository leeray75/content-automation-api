#!/bin/bash

# Docker Stop Script for Content Automation API
# Stops and removes the Docker container

set -e

# Configuration
CONTAINER_NAME="content-api"

echo "🛑 Stopping Docker container: ${CONTAINER_NAME}"

# Check if container exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    # Stop the container if it's running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "⏹️  Stopping running container..."
        docker stop "${CONTAINER_NAME}"
        echo "✅ Container stopped successfully"
    else
        echo "ℹ️  Container is not running"
    fi
    
    # Remove the container
    echo "🗑️  Removing container..."
    docker rm "${CONTAINER_NAME}"
    echo "✅ Container removed successfully"
else
    echo "ℹ️  Container '${CONTAINER_NAME}' does not exist"
fi

echo ""
echo "📊 Current Docker containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
