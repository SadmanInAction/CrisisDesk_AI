import request from 'supertest';
import app from '../index';
import { prisma } from '../services/db.service';

// Mock AI Service
jest.mock('../services/ai.service', () => ({
  classifyReport: jest.fn().mockResolvedValue({
    category: 'fire',
    urgency: 'critical',
    summary: 'A test fire.',
    suggestedAction: 'Call 911',
    confidence: 0.95
  }),
  generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  cosineSimilarity: jest.fn().mockReturnValue(0.9)
}));

describe('Reports API', () => {
  beforeAll(async () => {
    // Clean up DB before tests
    await prisma.report.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  let reportId: string;

  it('should create a new report', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send({
        name: 'Test User',
        location: 'Test City',
        description: 'There is a huge fire here!',
        language: 'en'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.category).toBe('fire');
    expect(res.body.urgency).toBe('critical');
    reportId = res.body.id;
  });

  it('should list reports', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a specific report', async () => {
    const res = await request(app).get(`/api/reports/${reportId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(reportId);
  });

  it('should update a report status (Admin)', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer supersecretadmin`)
      .send({ status: 'in_review' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_review');
  });

  it('should fail to update status without Admin Key', async () => {
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .send({ status: 'resolved' });

    expect(res.status).toBe(401);
  });
});
