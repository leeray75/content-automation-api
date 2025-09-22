#!/bin/bash

# Docker Inspect Script for Content Automation API
# Shows detailed container information and health status

set -e

# Configuration
CONTAINER_NAME="content-api"
IMAGE_NAME="content-automation-api"

echo "🔍 Inspecting Docker container and image: ${CONTAINER_NAME}"
echo "=================================================="

# Container status
echo ""
echo "📦 Container Status:"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.CreatedAt}}"
    
    # Container details
    echo ""
    echo "🔧 Container Details:"
    docker inspect "${CONTAINER_NAME}" --format '
Image: {{.Config.Image}}
State: {{.State.Status}}
Started: {{.State.StartedAt}}
Restart Count: {{.RestartCount}}
Platform: {{.Platform}}
Memory Limit: {{.HostConfig.Memory}}
CPU Shares: {{.HostConfig.CpuShares}}'

    # Health check
    echo ""
    echo "🏥 Health Status:"
    HEALTH_STATUS=$(docker inspect "${CONTAINER_NAME}" --format '{{.State.Health.Status}}' 2>/dev/null || echo "No health check configured")
    echo "Status: ${HEALTH_STATUS}"
    
    if [ "$HEALTH_STATUS" != "No health check configured" ]; then
        echo "Last Check: $(docker inspect "${CONTAINER_NAME}" --format '{{.State.Health.Log}}' | tail -1)"
    fi

    # Resource usage
    echo ""
    echo "📊 Resource Usage:"
    docker stats "${CONTAINER_NAME}" --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

else
    echo "❌ Container '${CONTAINER_NAME}' does not exist"
fi

# Image information
echo ""
echo "🖼️  Image Information:"
if docker images "${IMAGE_NAME}" --format '{{.Repository}}' | grep -q "${IMAGE_NAME}"; then
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    echo ""
    echo "🔍 Image Details:"
    docker inspect "${IMAGE_NAME}:latest" --format '
Created: {{.Created}}
Architecture: {{.Architecture}}
OS: {{.Os}}
Size: {{.Size}} bytes
Layers: {{len .RootFS.Layers}}' 2>/dev/null || echo "Image details not available"

else
    echo "❌ Image '${IMAGE_NAME}' not found"
    echo "💡 Run 'npm run docker:build' to build the image"
fi

# Network information
echo ""
echo "🌐 Network Information:"
if docker ps --filter "name=${CONTAINER_NAME}" --format '{{.Names}}' | grep -q "${CONTAINER_NAME}"; then
    docker inspect "${CONTAINER_NAME}" --format '
Network Mode: {{.HostConfig.NetworkMode}}
IP Address: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}
Ports: {{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{end}}'
fi

echo ""
echo "💡 Useful commands:"
echo "   docker exec -it ${CONTAINER_NAME} sh    # Access container shell"
echo "   docker logs ${CONTAINER_NAME}           # View container logs"
echo "   docker restart ${CONTAINER_NAME}        # Restart container"
