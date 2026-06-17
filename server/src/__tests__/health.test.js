const request = require('supertest');
const app = require('../app');

describe('health endpoint', () => {
  it('returns the API health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'OK',
      message: 'Tialz API is running'
    });
  });
});
