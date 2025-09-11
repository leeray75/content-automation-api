import { Router } from 'express';
import { articlesRouter } from './articles';
import { landingPagesRouter } from './landingPages';
import { adsRouter } from './ads';

const router = Router();

// Mount route modules
router.use('/articles', articlesRouter);
router.use('/landing-pages', landingPagesRouter);
router.use('/ads', adsRouter);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Content Automation API',
      version: '0.1.0',
      description: 'REST API for the Content Automation Platform',
      endpoints: {
        articles: '/api/articles',
        landingPages: '/api/landing-pages',
        ads: '/api/ads',
      },
      health: '/health',
    },
  });
});

export { router as apiRoutes };
