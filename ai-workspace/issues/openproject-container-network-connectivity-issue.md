# OpenProject Container Network Connectivity Issue

**Date:** September 24, 2025  
**Reporter:** Cline AI Assistant  
**Severity:** High  
**Status:** Diagnosed - Awaiting Fix  

## Issue Summary

The Content Automation API cannot connect to OpenProject from within Docker containers, resulting in `OPENPROJECT_NETWORK_ERROR` when calling the `/api/integrations/openproject/projects/{projectId}` endpoint. The authentication implementation is correct, but container-to-container network communication is failing due to hostname configuration mismatches.

## Symptoms

- ✅ Direct host-to-OpenProject requests work perfectly (200 OK)
- ❌ API endpoint returns 500 Internal Server Error with "Failed to connect to OpenProject"
- ❌ Container-to-container requests fail with "Invalid host_name configuration"

## Root Cause Analysis

### Primary Issues Identified

1. **OpenProject Hostname Validation**
   - OpenProject configured with `OPENPROJECT_HOST__NAME: localhost:8082`
   - Only accepts requests with matching `Host` header
   - Internal Docker network requests use `Host: openproject:8080`
   - Results in 400 Bad Request: "Invalid host_name configuration"

2. **API Container Base URL Configuration**
   - `OPENPROJECT_BASE_URL=http://openproject` (missing port `:8080`)
   - Should be `OPENPROJECT_BASE_URL=http://openproject:8080`
   - Environment variables don't persist when using `docker compose restart` with inline env vars

## Diagnostic Test Results

### Test 1: Host to OpenProject Direct
```bash
curl -i -u apikey:822999f8b326059690df24b4c638cb9ce71939f105b6a737eed762d46d74249e \
  -H "Accept: application/json" \
  "http://localhost:8082/api/v3/projects/test-project"
```
**Result:** ✅ **200 OK** - Returns complete project data

### Test 2: Host to API Endpoint
```bash
curl -i http://localhost:3000/api/integrations/openproject/projects/test-project
```
**Result:** ❌ **500 Internal Server Error**
```json
{
  "success": false,
  "error": {
    "code": "OPENPROJECT_NETWORK_ERROR",
    "message": "Failed to connect to OpenProject"
  }
}
```

### Test 3: Container-to-Container Connectivity
```bash
docker compose exec content-automation-api sh -c \
  "curl -i -u apikey:822999f8b326059690df24b4c638cb9ce71939f105b6a737eed762d46d74249e \
   -H 'Accept: application/json' \
   'http://openproject:8080/api/v3/projects/test-project'"
```
**Result:** ❌ **400 Bad Request**
```
HTTP/1.1 400 Bad Request
Content-Type: text/plain
Content-Length: 31

Invalid host_name configuration
```

## Container Logs Analysis

### API Container Logs
```
[2025-09-24T22:34:47.472Z] INFO  Fetching OpenProject project: test-project {
  "url": "http://openproject/api/v3/projects/test-project"
}
[2025-09-24T22:34:47.490Z] ERROR Network error fetching OpenProject project {
  "projectId": "test-project",
  "url": "http://openproject/api/v3/projects/test-project",
  "error": "fetch failed"
}
[2025-09-24T22:34:47.490Z] ERROR Error occurred: {
  "message": "Failed to connect to OpenProject",
  "stack": "Error: Failed to connect to OpenProject\n    at OpenProjectService.getProject (/app/dist/services/openprojectService.js:78:34)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/routes/integrations/openproject.js:30:25",
  "url": "/api/integrations/openproject/projects/test-project",
  "method": "GET",
  "body": {}
}
```

**Key Observations:**
- URL missing port: `http://openproject/api/v3/projects/test-project` (should be `:8080`)
- Fetch operation fails at network level
- Error occurs in OpenProjectService.getProject method

### Environment Variables in API Container
```bash
docker compose exec content-automation-api env | grep OPENPROJECT
```
**Result:**
```
OPENPROJECT_API_TOKEN=822999f8b326059690df24b4c638cb9ce71939f105b6a737eed762d46d74249e
OPENPROJECT_BASE_URL=http://openproject
```

**Issues:**
- Missing port `:8080` in OPENPROJECT_BASE_URL
- Environment variables revert to defaults after restart

## Docker Compose Configuration Analysis

### Current OpenProject Configuration
```yaml
openproject:
  image: openproject/openproject:16.4.1-slim
  environment:
    OPENPROJECT_HOST__NAME: localhost:8082  # ← Only accepts localhost:8082
    # ... other config
  ports:
    - "8082:8080"
```

### Current API Configuration
```yaml
content-automation-api:
  environment:
    - OPENPROJECT_BASE_URL=${OPENPROJECT_BASE_URL:-http://openproject:8080}  # ← Default includes port
    - OPENPROJECT_API_TOKEN=${OPENPROJECT_API_TOKEN:-}
```

**Issue:** Environment variable override not persisting properly.

## Authentication Status

✅ **Authentication Implementation is CORRECT**
- Basic auth implementation working: `Authorization: Basic base64('apikey:' + token)`
- Direct curl with Basic auth succeeds
- Token is valid and properly formatted
- Issue is purely network connectivity, not authentication

## Impact Assessment

- **Severity:** High - Core integration functionality broken
- **Scope:** All OpenProject API calls from containerized API
- **Workaround:** Direct host-to-OpenProject calls work (for testing)
- **User Impact:** API consumers cannot access OpenProject data

## Recommended Solutions

### Solution 1: Fix OpenProject Host Configuration (Recommended)
Update docker-compose.yml to accept both internal and external hostnames:

```yaml
openproject:
  environment:
    OPENPROJECT_HOST__NAME: "localhost:8082,openproject:8080"
```

### Solution 2: Fix API Base URL in Environment File
Permanently set the correct base URL in .env:

```bash
echo "OPENPROJECT_BASE_URL=http://openproject:8080" >> .env
```

### Solution 3: Use Host Network Access
Configure API to access OpenProject via host network:

```yaml
content-automation-api:
  environment:
    - OPENPROJECT_BASE_URL=http://host.docker.internal:8082
```

### Solution 4: Update Docker Compose Defaults
Ensure the default includes the port:

```yaml
content-automation-api:
  environment:
    - OPENPROJECT_BASE_URL=${OPENPROJECT_BASE_URL:-http://openproject:8080}
```

## Implementation Priority

1. **Immediate:** Update docker-compose.yml with Solution 1 (OpenProject hostname)
2. **Secondary:** Verify .env file has correct OPENPROJECT_BASE_URL
3. **Testing:** Restart containers and verify connectivity
4. **Validation:** Run full API endpoint test

## Files Affected

- `content-automation-platform/content-automation-stack/docker-compose.yml`
- `content-automation-platform/content-automation-stack/.env`
- Container environment variables

## Related Issues

- Issue #7: OpenProject authentication implementation (RESOLVED)
- Git submodule sync completed successfully
- Authentication fix deployed and working

## Next Steps

1. Choose and implement one of the recommended solutions
2. Restart affected containers
3. Test API endpoint connectivity
4. Verify logs show successful connection
5. Update completion report

## Technical Notes

- OpenProject version: 16.4.1-slim
- API container: Node.js with fetch API
- Network: content-automation-network (bridge mode)
- Port mapping: 8082:8080 (host:container)

## Verification Commands

After implementing fix:

```bash
# Test API endpoint
curl http://localhost:3000/api/integrations/openproject/projects/test-project

# Check container logs
docker compose logs --tail 20 content-automation-api

# Verify environment variables
docker compose exec content-automation-api env | grep OPENPROJECT
```

Expected success response:
```json
{
  "success": true,
  "data": {
    "_type": "Project",
    "id": 1,
    "identifier": "test-project",
    "name": "Test Project",
    // ... full project data
  }
}
