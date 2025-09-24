import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { getProject } from '../../services/openprojectService';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /projects/:projectId
 * Fetch project information from OpenProject
 */
router.get('/projects/:projectId', asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PROJECT_ID',
        message: 'Project ID is required',
      },
    });
  }

  logger.info(`OpenProject API request for project: ${projectId}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  try {
    const project = await getProject(projectId);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    // The asyncHandler will catch and forward errors to the global error handler
    // which will map our custom OpenProjectError with statusCode to appropriate HTTP responses
    throw error;
  }
}));

export { router as openProjectRouter };
