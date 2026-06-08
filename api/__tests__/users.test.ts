import request from 'supertest';
import app from '../app.js';
import {
  createTestUser,
  createTestHabit,
  createTestCheckin,
  authRequest,
  unauthRequest,
} from './helpers.js';

describe('Users Routes', () => {
  describe('GET /api/users/stats', () => {
    it('should return user stats for authenticated user', async () => {
      const { userId, token } = await createTestUser();
      const habitId1 = createTestHabit(userId, '习惯1');
      const habitId2 = createTestHabit(userId, '习惯2');

      createTestCheckin(userId, habitId1, '2024-01-01');
      createTestCheckin(userId, habitId1, '2024-01-02');
      createTestCheckin(userId, habitId1, '2024-01-03');
      createTestCheckin(userId, habitId2, '2024-01-01');

      const response = await authRequest(token).get('/api/users/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取用户统计成功');
      expect(response.body.data).toHaveProperty('totalCheckins');
      expect(response.body.data).toHaveProperty('streakDays');
      expect(response.body.data).toHaveProperty('habitsCount');
      expect(response.body.data).toHaveProperty('checkinsThisWeek');
      expect(response.body.data).toHaveProperty('checkinsThisMonth');
      expect(response.body.data).toHaveProperty('habitStats');
      expect(Array.isArray(response.body.data.habitStats)).toBe(true);
    });

    it('should return correct habit count', async () => {
      const { userId, token } = await createTestUser();
      createTestHabit(userId, '习惯1');
      createTestHabit(userId, '习惯2');
      createTestHabit(userId, '习惯3');

      const response = await authRequest(token).get('/api/users/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.habitsCount).toBe(3);
    });

    it('should return correct total checkins', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      createTestCheckin(userId, habitId, '2024-01-01');
      createTestCheckin(userId, habitId, '2024-01-02');
      createTestCheckin(userId, habitId, '2024-01-03');

      const response = await authRequest(token).get('/api/users/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.totalCheckins).toBe(3);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest().get('/api/users/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return zeros for new user with no data', async () => {
      const { token } = await createTestUser('newuser', 'new@example.com');

      const response = await authRequest(token).get('/api/users/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.totalCheckins).toBe(0);
      expect(response.body.data.habitsCount).toBe(0);
      expect(response.body.data.habitStats.length).toBe(0);
    });
  });
});

describe('Health Check', () => {
  describe('GET /api/health', () => {
    it('should return health check ok', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('ok');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('API 接口不存在');
    });

    it('should return 404 for non-existent POST route', async () => {
      const response = await request(app).post('/api/nonexistent').send({});

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
