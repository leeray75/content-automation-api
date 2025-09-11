import { Router } from 'express';
import { Request, Response } from 'express';
import { ResponseHelper } from '../utils/responses';

const router = Router();

// GET /api/articles - List all articles
router.get('/', (req: Request, res: Response) => {
  // TODO: Implement article listing
  return ResponseHelper.success(res, [], 'Articles retrieved successfully');
});

// GET /api/articles/:id - Get article by ID
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Implement article retrieval by ID
  return ResponseHelper.notFound(res, 'Article');
});

// POST /api/articles - Create new article
router.post('/', (req: Request, res: Response) => {
  // TODO: Implement article creation with validation
  return ResponseHelper.created(res, {}, 'Article created successfully');
});

// PUT /api/articles/:id - Update article
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Implement article update
  return ResponseHelper.notFound(res, 'Article');
});

// DELETE /api/articles/:id - Delete article
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Implement article deletion
  return ResponseHelper.notFound(res, 'Article');
});

export { router as articlesRouter };
