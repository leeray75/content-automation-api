#!/bin/bash

# Docker Logs Script for Content Automation API
# Shows container logs with optional follow mode

set -e

# Configuration
CONTAINER_NAME="content-api"
FOLLOW_MODE="${1:-false}"
LINES="${2:-100}"

echo "📋 Viewing logs for container: ${CONTAINER_NAME}"

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Container '${CONTAINER_NAME}' does not exist"
    echo "💡 Run 'npm run docker:run' to start the container first"
    exit 1
fi

# Show logs
if [ "$FOLLOW_MODE" = "follow" ] || [ "$FOLLOW_MODE" = "-f" ] || [ "$FOLLOW_MODE" = "true" ]; then
    echo "👀 Following logs (press Ctrl+C to stop)..."
    docker logs -f --tail "$LINES" "$CONTAINER_NAME"
else
    echo "📄 Showing last $LINES lines..."
    docker logs --tail "$LINES" "$CONTAINER_NAME"
fi

echo ""
echo "💡 Usage examples:"
echo "   npm run docker:logs              # Show last 100 lines"
echo "   npm run docker:logs follow       # Follow logs in real-time"
echo "   ./scripts/docker-logs.sh follow 50  # Follow last 50 lines"
