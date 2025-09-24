import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

// Mock the logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the OpenProject service
vi.mock('../src/services/openprojectService', () => {
  const mockGetProject = vi.fn();
  return {
    getProject: mockGetProject,
    OpenProjectService: vi.fn().mockImplementation(() => ({
      getProject: mockGetProject,
    })),
  };
});

describe('OpenProject Routes', () => {
  let mockGetProject: any;

  beforeEach(async () => {
    // Get the mocked function
    const { getProject } = await import('../src/services/openprojectService');
    mockGetProject = getProject as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/integrations/openproject/projects/:projectId', () => {
    it('should return project data for valid project ID', async () => {
      const mockProjectData = {
        id: '123',
        identifier: 'test-project',
        name: 'Test Project',
        description: 'Test project description',
        raw: {
          id: 123,
          identifier: 'test-project',
          name: 'Test Project',
          description: { raw: 'Test project description' },
        },
      };

      mockGetProject.mockResolvedValueOnce(mockProjectData);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockProjectData,
      });

      expect(mockGetProject).toHaveBeenCalledWith('123');
    });

    it('should return 401 for unauthorized access', async () => {
      const error = new Error('Unauthorized access to OpenProject') as any;
      error.statusCode = 401;
      error.code = 'OPENPROJECT_UNAUTHORIZED';

      mockGetProject.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/123')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'OPENPROJECT_UNAUTHORIZED',
          message: 'Unauthorized access to OpenProject',
        },
      });
    });

    it('should return 404 for project not found', async () => {
      const error = new Error('Project 999 not found') as any;
      error.statusCode = 404;
      error.code = 'OPENPROJECT_NOT_FOUND';

      mockGetProject.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'OPENPROJECT_NOT_FOUND',
          message: 'Project 999 not found',
        },
      });
    });

    it('should return 500 for OpenProject server errors', async () => {
      const error = new Error('OpenProject API error: 500 Internal Server Error') as any;
      error.statusCode = 500;
      error.code = 'OPENPROJECT_ERROR';

      mockGetProject.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/123')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'OPENPROJECT_ERROR',
          message: 'OpenProject API error: 500 Internal Server Error',
        },
      });
    });

    it('should return 500 for missing API token configuration', async () => {
      const error = new Error('OpenProject API token not configured') as any;
      error.statusCode = 500;
      error.code = 'OPENPROJECT_CONFIG_ERROR';

      mockGetProject.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/123')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'OPENPROJECT_CONFIG_ERROR',
          message: 'OpenProject API token not configured',
        },
      });
    });

    it('should return 500 for network errors', async () => {
      const error = new Error('Failed to connect to OpenProject') as any;
      error.statusCode = 500;
      error.code = 'OPENPROJECT_NETWORK_ERROR';

      mockGetProject.mockRejectedValueOnce(error);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/123')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'OPENPROJECT_NETWORK_ERROR',
          message: 'Failed to connect to OpenProject',
        },
      });
    });

    it('should handle projects with minimal data', async () => {
      const mockProjectData = {
        id: '456',
        identifier: undefined,
        name: 'Minimal Project',
        description: undefined,
        raw: {
          id: 456,
          name: 'Minimal Project',
        },
      };

      mockGetProject.mockResolvedValueOnce(mockProjectData);

      const response = await request(app)
        .get('/api/integrations/openproject/projects/456')
        .expect(200);

      expect(response.body.data).toEqual(mockProjectData);
    });

    it('should validate project ID parameter', async () => {
      // Test with empty project ID (this would be caught by Express routing)
      const response = await request(app)
        .get('/api/integrations/openproject/projects/')
        .expect(404); // Express will return 404 for missing route parameter

      expect(mockGetProject).not.toHaveBeenCalled();
    });
  });

  describe('API info endpoint', () => {
    it('should include OpenProject integration in API info', async () => {
      const response = await request(app)
        .get('/api/')
        .expect(200);

      expect(response.body.data.endpoints).toHaveProperty('openproject');
      expect(response.body.data.endpoints.openproject).toBe('/api/integrations/openproject');
    });
  });
});
