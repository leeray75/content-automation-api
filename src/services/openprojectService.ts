import { logger } from '../utils/logger';

export interface ProjectDTO {
  id: string;
  identifier?: string;
  name?: string;
  description?: string;
  raw?: any;
}

export interface OpenProjectError extends Error {
  statusCode: number;
  code: string;
}

export class OpenProjectService {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl?: string, apiToken?: string) {
    this.baseUrl = baseUrl || process.env.OPENPROJECT_BASE_URL || 'http://openproject:8080';
    this.apiToken = apiToken || process.env.OPENPROJECT_API_TOKEN || '';

    if (!this.apiToken) {
      logger.warn('OPENPROJECT_API_TOKEN not configured - OpenProject requests will fail');
    }
  }

  async getProject(projectId: string): Promise<ProjectDTO> {
    if (!this.apiToken) {
      const error = new Error('OpenProject API token not configured') as OpenProjectError;
      error.statusCode = 500;
      error.code = 'OPENPROJECT_CONFIG_ERROR';
      throw error;
    }

    const url = `${this.baseUrl}/api/v3/projects/${projectId}`;
    
    logger.info(`Fetching OpenProject project: ${projectId}`, { url });

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      // Handle different response statuses
      if (response.status === 401) {
        const error = new Error('Unauthorized access to OpenProject') as OpenProjectError;
        error.statusCode = 401;
        error.code = 'OPENPROJECT_UNAUTHORIZED';
        throw error;
      }

      if (response.status === 404) {
        const error = new Error(`Project ${projectId} not found`) as OpenProjectError;
        error.statusCode = 404;
        error.code = 'OPENPROJECT_NOT_FOUND';
        throw error;
      }

      if (!response.ok) {
        const error = new Error(`OpenProject API error: ${response.status} ${response.statusText}`) as OpenProjectError;
        error.statusCode = response.status;
        error.code = 'OPENPROJECT_ERROR';
        throw error;
      }

      const projectData = await response.json() as any;

      // Map to our DTO format
      const project: ProjectDTO = {
        id: projectData.id?.toString() || projectId,
        identifier: projectData.identifier,
        name: projectData.name,
        description: projectData.description?.raw || projectData.description,
        raw: projectData, // Include full payload for flexibility
      };

      logger.info(`Successfully fetched OpenProject project: ${projectId}`, {
        projectName: project.name,
        projectIdentifier: project.identifier,
      });

      return project;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      // Handle network/fetch errors
      logger.error('Network error fetching OpenProject project', {
        projectId,
        url,
        error: error instanceof Error ? error.message : String(error),
      });

      const networkError = new Error('Failed to connect to OpenProject') as OpenProjectError;
      networkError.statusCode = 500;
      networkError.code = 'OPENPROJECT_NETWORK_ERROR';
      throw networkError;
    }
  }
}

// Export singleton instance (lazy initialization)
let _openProjectService: OpenProjectService | null = null;

export const getOpenProjectService = (): OpenProjectService => {
  if (!_openProjectService) {
    _openProjectService = new OpenProjectService();
  }
  return _openProjectService;
};

// Export the main function for convenience
export const getProject = (projectId: string): Promise<ProjectDTO> => 
  getOpenProjectService().getProject(projectId);

// For testing - allow resetting the singleton
export const resetOpenProjectService = (): void => {
  _openProjectService = null;
};
