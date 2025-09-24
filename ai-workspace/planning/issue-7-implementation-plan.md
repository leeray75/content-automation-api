# Issue #7: Implement OpenProject project endpoint

## Overview
Implement a new API endpoint that fetches project information from OpenProject and returns it to API clients. This will enable integrations that require OpenProject project metadata.

## Goals
- Add GET /api/integrations/openproject/projects/:projectId
- Encapsulate OpenProject HTTP logic in a service module
- Map OpenProject errors (401/404/5xx) to appropriate HTTP responses
- Add unit and integration tests
- Document env vars and endpoint usage
- Deliver changes on branch: feature/issue-7-openproject-project-endpoint

## Success Criteria
- Endpoint returns project JSON for valid projectId
- Unauthorized and Not Found responses are mapped to 401 and 404 respectively
- Tests cover service error mapping and route responses
- README/API docs updated

## Implementation Plan

### Phase 1 — Scaffolding
- Create branch: feature/issue-7-openproject-project-endpoint
- Add planning document (this file)
- Add placeholder TODOs in README

### Phase 2 — Service
- File: src/services/openprojectService.ts
  - Export: async function getProject(projectId: string): Promise<ProjectDTO>
  - Use env vars: OPENPROJECT_BASE_URL, OPENPROJECT_API_TOKEN
  - Use fetch with Authorization: Bearer <token>
  - Map response statuses:
    - 200 -> return parsed JSON
    - 401 -> throw { message, statusCode: 401, code: 'OPENPROJECT_UNAUTHORIZED' }
    - 404 -> throw { message, statusCode: 404, code: 'OPENPROJECT_NOT_FOUND' }
    - other -> throw { message, statusCode: response.status || 500, code: 'OPENPROJECT_ERROR' }

- Define ProjectDTO (minimal):
  - id: string
  - identifier?: string
  - name?: string
  - description?: string
  - raw?: any (optional full payload)

### Phase 3 — Route
- File: src/routes/integrations/openproject.ts
  - Router GET /projects/:projectId
  - Use asyncHandler wrapper (from middleware/errorHandler.ts)
  - Call service.getProject and return ResponseHelper.success(res, data) or res.json({ success:true, data })

- Register route in src/routes/index.ts:
  - router.use('/integrations/openproject', openProjectRouter)

### Phase 4 — Tests
- Unit: test/openproject.service.test.ts
  - Mock globalThis.fetch for 200/401/404/500 responses
  - Assert behavior and thrown errors with statusCode

- Integration: test/openproject.route.test.ts
  - Use supertest against app import (src/app.ts)
  - Stub fetch to return a valid project and verify /api/integrations/openproject/projects/:projectId returns 200 and project payload
  - Test error mappings (401 -> 401, 404 -> 404)

### Phase 5 — Docs & Env updates
- Update content-automation-platform/content-automation-api/README.md
  - Document endpoint usage and required env vars: OPENPROJECT_BASE_URL, OPENPROJECT_API_TOKEN
- Update content-automation-platform/content-automation-stack/.env.example or docker-compose defaults:
  - Recommend internal default: OPENPROJECT_BASE_URL=http://openproject:8080
  - Ensure OPENPROJECT_API_TOKEN is documented (left blank by default)

### Phase 6 — CI & final checks
- Run tests: npm test
- Lint and format
- Commit and push branch

## Docker / Compose Notes (applies to stack)
- Inside the docker-compose network, OpenProject listens on container port 8080 (image default).
- For internal service-to-service calls, use OPENPROJECT_BASE_URL=http://openproject:8080.
- The UI must continue to use host-facing NEXT_PUBLIC_OPENPROJECT_BASE_URL (e.g., http://localhost:8082).
- OPENPROJECT_API_TOKEN must be provided via environment or secret — do not check into source.

## Files to be created/modified
- Added:
  - src/services/openprojectService.ts
  - src/routes/integrations/openproject.ts
  - test/openproject.service.test.ts
  - test/openproject.route.test.ts
  - ai-workspace/planning/issue-7-implementation-plan.md (this document)
- Modified:
  - src/routes/index.ts (register integration route)
  - README.md (docs)
  - content-automation-stack/docker-compose.yml (optional change to OPENPROJECT_BASE_URL default)

## Branching & Commits
- Branch name: feature/issue-7-openproject-project-endpoint
- Commit granularity:
  - feat(openproject): add service
  - feat(openproject): add route and register
  - test(openproject): add unit + integration tests
  - docs: update README and ai-workspace planning
  - chore: update docker-compose defaults (if applied)

## Risks & Mitigations
- Missing API token -> service will return 401; tests will cover mapping.
- OpenProject startup lag when using compose -> consider depends_on condition service_healthy if required (optional).
