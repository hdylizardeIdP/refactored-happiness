import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health Endpoints', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return 200 and success message', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /status', () => {
    it('should return system status', async () => {
      const response = await request(app).get('/status');

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('service', 'SMS Assistant');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('checks');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
