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
  private hostHeader?: string;
  private timeoutMs: number;

  constructor(baseUrl?: string, apiToken?: string, hostHeader?: string, timeoutMs?: number) {
    // Normalize base URL: strip trailing slash
    let urlStr = baseUrl || process.env.OPENPROJECT_BASE_URL || 'http://openproject:8080';
    urlStr = urlStr.replace(/\/+$/, '');

    // If hostname is "openproject" and no port provided, default to :8080
    try {
      const u = new URL(urlStr);
      if (!u.port && u.hostname === 'openproject') {
        u.port = '8080';
        urlStr = u.toString().replace(/\/+$/, '');
      }
    } catch (err) {
      // leave urlStr as-is; fetch will error and provide feedback
      logger.warn('Invalid OPENPROJECT_BASE_URL format', { baseUrl: urlStr });
    }

    this.baseUrl = urlStr;
    this.apiToken = apiToken || process.env.OPENPROJECT_API_TOKEN || '';
    this.hostHeader = hostHeader || process.env.OPENPROJECT_HOST_HEADER;
    this.timeoutMs = timeoutMs || parseInt(process.env.OPENPROJECT_TIMEOUT_MS || '10000');

    if (!this.apiToken) {
      logger.warn('OPENPROJECT_API_TOKEN not configured - OpenProject requests will fail');
    }

    logger.info('OpenProject service initialized', {
      baseUrl: this.baseUrl,
      hasToken: !!this.apiToken,
      hostHeader: this.hostHeader,
      timeoutMs: this.timeoutMs,
    });
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
      // OpenProject API keys use Basic auth with username "apikey" and the token as password
      const auth = Buffer.from(`apikey:${this.apiToken}`).toString('base64');
      
      // Build headers with optional Host header override
      const headers: Record<string, string> = {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      if (this.hostHeader) {
        headers['Host'] = this.hostHeader;
        logger.debug('Using custom Host header', { hostHeader: this.hostHeader });
      }

      // Set up timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('OpenProject request timed out', {
          projectId,
          url,
          timeoutMs: this.timeoutMs,
        });
        const timeoutError = new Error(`OpenProject request timed out after ${this.timeoutMs}ms`) as OpenProjectError;
        timeoutError.statusCode = 408;
        timeoutError.code = 'OPENPROJECT_TIMEOUT';
        throw timeoutError;
      }

      // Handle network/fetch errors
      logger.error('Network error fetching OpenProject project', {
        projectId,
        url,
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Unknown',
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
