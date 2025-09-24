import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OpenProjectService, getProject, resetOpenProjectService } from '../src/services/openprojectService';

// Mock the logger
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('OpenProjectService', () => {
  let service: OpenProjectService;
  let mockFetch: any;

  beforeEach(() => {
    // Mock environment variables
    process.env.OPENPROJECT_BASE_URL = 'http://test-openproject:8080';
    process.env.OPENPROJECT_API_TOKEN = 'test-token';

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Create service with explicit parameters to avoid env var caching issues
    service = new OpenProjectService('http://test-openproject:8080', 'test-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENPROJECT_BASE_URL;
    delete process.env.OPENPROJECT_API_TOKEN;
  });

  describe('getProject', () => {
    it('should successfully fetch and return project data', async () => {
      const mockProjectData = {
        id: 123,
        identifier: 'test-project',
        name: 'Test Project',
        description: { raw: 'Test project description' },
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjectData),
      });

      const result = await service.getProject('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-openproject:8080/api/v3/projects/123',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        id: '123',
        identifier: 'test-project',
        name: 'Test Project',
        description: 'Test project description',
        raw: mockProjectData,
      });
    });

    it('should throw 401 error for unauthorized access', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(service.getProject('123')).rejects.toMatchObject({
        message: 'Unauthorized access to OpenProject',
        statusCode: 401,
        code: 'OPENPROJECT_UNAUTHORIZED',
      });
    });

    it('should throw 404 error for project not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(service.getProject('999')).rejects.toMatchObject({
        message: 'Project 999 not found',
        statusCode: 404,
        code: 'OPENPROJECT_NOT_FOUND',
      });
    });

    it('should throw 500 error for server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.getProject('123')).rejects.toMatchObject({
        message: 'OpenProject API error: 500 Internal Server Error',
        statusCode: 500,
        code: 'OPENPROJECT_ERROR',
      });
    });

    it('should throw config error when API token is missing', async () => {
      delete process.env.OPENPROJECT_API_TOKEN;
      const serviceWithoutToken = new OpenProjectService();

      await expect(serviceWithoutToken.getProject('123')).rejects.toMatchObject({
        message: 'OpenProject API token not configured',
        statusCode: 500,
        code: 'OPENPROJECT_CONFIG_ERROR',
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw network error for fetch failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getProject('123')).rejects.toMatchObject({
        message: 'Failed to connect to OpenProject',
        statusCode: 500,
        code: 'OPENPROJECT_NETWORK_ERROR',
      });
    });

    it('should handle project data with string description', async () => {
      const mockProjectData = {
        id: 456,
        identifier: 'simple-project',
        name: 'Simple Project',
        description: 'Simple string description',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjectData),
      });

      const result = await service.getProject('456');

      expect(result.description).toBe('Simple string description');
    });

    it('should use projectId as fallback for missing id', async () => {
      const mockProjectData = {
        identifier: 'no-id-project',
        name: 'Project Without ID',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjectData),
      });

      const result = await service.getProject('fallback-id');

      expect(result.id).toBe('fallback-id');
    });
  });

  describe('getProject function export', () => {
    it('should work as a standalone function', async () => {
      // Set environment variables for the global singleton
      process.env.OPENPROJECT_BASE_URL = 'http://test-openproject:8080';
      process.env.OPENPROJECT_API_TOKEN = 'test-token';
      
      // Reset singleton to pick up new environment variables
      resetOpenProjectService();

      const mockProjectData = {
        id: 789,
        identifier: 'standalone-test',
        name: 'Standalone Test',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjectData),
      });

      const result = await getProject('789');

      expect(result.id).toBe('789');
      expect(result.identifier).toBe('standalone-test');
    });
  });
});
