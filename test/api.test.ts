import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Content Automation API', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', 'Content Automation API');
      expect(response.body.data).toHaveProperty('version', '0.1.0');
      expect(response.body.data).toHaveProperty('endpoints');
    });
  });

  describe('Articles Endpoints', () => {
    it('should list articles', async () => {
      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toBe('Articles retrieved successfully');
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .get('/api/articles/123')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Landing Pages Endpoints', () => {
    it('should list landing pages', async () => {
      const response = await request(app)
        .get('/api/landing-pages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toBe('Landing pages retrieved successfully');
    });
  });

  describe('Ads Endpoints', () => {
    it('should list ads', async () => {
      const response = await request(app)
        .get('/api/ads')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.message).toBe('Ads retrieved successfully');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
