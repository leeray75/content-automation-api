# OpenProject "Invalid host_name configuration" Root Cause Analysis

**Date:** September 24, 2025  
**Issue:** Determining what changes caused OpenProject to respond with "Invalid host_name configuration"  
**Status:** Root Cause Investigation  

## Question: What Changes Caused the Hostname Error?

The user is asking what specific changes I made that resulted in OpenProject responding with "Invalid host_name configuration" instead of working properly.

## Changes Made During This Session

### 1. Docker Compose Configuration Change ⚠️

**File:** `content-automation-platform/content-automation-stack/docker-compose.yml`

**BEFORE:**
```yaml
OPENPROJECT_HOST__NAME: localhost:8082
```

**AFTER:**
```yaml
OPENPROJECT_HOST__NAME: "localhost:8082,openproject:8080"
```

**Intent:** Allow OpenProject to accept requests from both external (localhost:8082) and internal container (openproject:8080) hostnames.

**Potential Issue:** This change may have introduced the hostname validation error.

### 2. Environment Variable Addition

**File:** `content-automation-platform/content-automation-stack/docker-compose.yml`

**ADDED:**
```yaml
- OPENPROJECT_HOST_HEADER=${OPENPROJECT_HOST_HEADER:-localhost:8082}
```

**Intent:** Provide Host header override capability for API requests.

**Potential Issue:** This is for the API container, not OpenProject, so unlikely to cause the issue.

### 3. Environment File Addition

**File:** `content-automation-platform/content-automation-stack/.env`

**ADDED:**
```bash
OPENPROJECT_BASE_URL=http://openproject:8080
```

**Intent:** Persist the base URL configuration.

**Potential Issue:** This affects the API container, not OpenProject directly.

## Root Cause Analysis

### Most Likely Cause: OPENPROJECT_HOST__NAME Format Issue

The change from:
```yaml
OPENPROJECT_HOST__NAME: localhost:8082
```

To:
```yaml
OPENPROJECT_HOST__NAME: "localhost:8082,openproject:8080"
```

**This is the most likely culprit** because:

1. **OpenProject Documentation:** The comma-separated format may not be supported
2. **Syntax Issue:** OpenProject might expect a different format for multiple hostnames
3. **Version Compatibility:** OpenProject 16.4.1-slim might not support multiple hostnames

### Alternative Possible Causes

#### Cause 2: Container Recreation Side Effects
- Multiple container restarts and recreations
- Potential database state corruption
- Configuration caching issues

#### Cause 3: Environment Variable Precedence
- New environment variables conflicting with existing ones
- Docker Compose environment variable resolution issues

## Verification Test: Revert the Change

To confirm this is the root cause, we should revert the hostname change:

### Step 1: Revert to Original Configuration
```yaml
# Change back to original
OPENPROJECT_HOST__NAME: localhost:8082
```

### Step 2: Test External Access
```bash
curl -i "http://localhost:8082/"
# Should work for external requests
```

### Step 3: Test Internal Access
```bash
docker compose exec content-automation-api curl "http://openproject:8080/"
# Will likely fail, but with different error (not hostname error)
```

## Alternative Hostname Configuration Approaches

If the comma-separated format is the issue, try these alternatives:

### Option 1: Wildcard Hostname
```yaml
OPENPROJECT_HOST__NAME: "*"
```

### Option 2: Array Format (if supported)
```yaml
OPENPROJECT_HOST__NAME: 
  - localhost:8082
  - openproject:8080
```

### Option 3: Environment Variable Override
```yaml
OPENPROJECT_HOST__NAME: ${OPENPROJECT_ALLOWED_HOSTS:-localhost:8082}
```

## Timeline of Events

1. **Initial State:** OpenProject working with `OPENPROJECT_HOST__NAME: localhost:8082`
2. **Change Made:** Modified to `OPENPROJECT_HOST__NAME: "localhost:8082,openproject:8080"`
3. **Container Restart:** OpenProject container restarted to pick up new config
4. **Error Appears:** All requests start returning "Invalid host_name configuration"
5. **Multiple Attempts:** Container recreation, environment variable checks, etc.
6. **Error Persists:** Same error regardless of request type or source

## Conclusion

**The most likely cause of the "Invalid host_name configuration" error is the change to the `OPENPROJECT_HOST__NAME` environment variable format.**

**Specifically:**
- **Original:** `OPENPROJECT_HOST__NAME: localhost:8082` (working)
- **Modified:** `OPENPROJECT_HOST__NAME: "localhost:8082,openproject:8080"` (causing error)

**Recommendation:**
1. Revert the `OPENPROJECT_HOST__NAME` to the original value
2. Test that OpenProject becomes accessible again
3. Find an alternative approach for container-to-container communication that doesn't break the hostname validation

## Alternative Solutions (Without Breaking OpenProject)

### Solution 1: Use Host Header Override Only
Keep OpenProject hostname as original, use API client Host header override:
```yaml
# OpenProject (revert to original)
OPENPROJECT_HOST__NAME: localhost:8082

# API container (keep the Host header override)
OPENPROJECT_HOST_HEADER: localhost:8082
```

### Solution 2: Network Configuration
Use Docker networking to make container requests appear as localhost:
```yaml
# Use extra_hosts to map openproject to localhost
openproject:
  extra_hosts:
    - "localhost:127.0.0.1"
```

### Solution 3: Reverse Proxy
Add nginx reverse proxy to handle hostname translation between external and internal requests.

The key insight is that **the comma-separated hostname format likely broke OpenProject's hostname validation**, and we need to find a different approach that doesn't modify OpenProject's core hostname configuration.
