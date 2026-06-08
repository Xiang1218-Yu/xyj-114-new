import { createTestUser, createTestHabit, authRequest, unauthRequest } from './helpers.js';
import type { Habit } from '../../shared/types.js';

describe('Habits Routes', () => {
  describe('GET /api/habits', () => {
    it('should return habits list for authenticated user', async () => {
      const { userId, token } = await createTestUser();
      const habitId1 = createTestHabit(userId, '阅读', '📚', '#FF6B6B', 'daily', 30);
      const habitId2 = createTestHabit(userId, '运动', '🏃', '#4ECDC4', 'daily', 21);

      const response = await authRequest(token).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取习惯列表成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].id).toBe(habitId1);
      expect(response.body.data[0].name).toBe('阅读');
      expect(response.body.data[1].id).toBe(habitId2);
      expect(response.body.data[1].name).toBe('运动');
    });

    it('should return empty array when user has no habits', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should not return habits from other users', async () => {
      const { userId: user1Id, token: token1 } = await createTestUser(
        'user1',
        'user1@example.com'
      );
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');

      createTestHabit(user1Id, '用户1的习惯');

      const response = await authRequest(token2).get('/api/habits');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(0);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest().get('/api/habits');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/habits', () => {
    it('should create a new habit successfully', async () => {
      const { userId, token } = await createTestUser();

      const habitData = {
        name: '新习惯',
        icon: '🎯',
        color: '#95E1D3',
        frequency: 'daily' as const,
        targetDays: 21,
      };

      const response = await authRequest(token).post('/api/habits').send(habitData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('创建习惯成功');
      expect(response.body.data.name).toBe('新习惯');
      expect(response.body.data.icon).toBe('🎯');
      expect(response.body.data.color).toBe('#95E1D3');
      expect(response.body.data.frequency).toBe('daily');
      expect(response.body.data.targetDays).toBe(21);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should create habit with optional fields', async () => {
      const { token } = await createTestUser();

      const habitData = {
        name: '完整习惯',
        icon: '⭐',
        color: '#F38181',
        frequency: 'weekly' as const,
        targetDays: 3,
        reminderTime: '08:00',
        reminderEnabled: true,
        shortTermGoal: '坚持一个月',
        longTermGoal: '坚持一年',
        category: '健康',
      };

      const response = await authRequest(token).post('/api/habits').send(habitData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reminderTime).toBe('08:00');
      expect(response.body.data.reminderEnabled).toBe(true);
      expect(response.body.data.shortTermGoal).toBe('坚持一个月');
      expect(response.body.data.longTermGoal).toBe('坚持一年');
      expect(response.body.data.category).toBe('健康');
    });

    it('should return validation error when required fields are missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).post('/api/habits').send({
        name: '缺少字段的习惯',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return validation error for invalid frequency', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/habits')
        .send({
          name: '测试习惯',
          icon: '✅',
          color: '#FF6B6B',
          frequency: 'invalid',
          targetDays: 7,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.frequency).toBeDefined();
    });

    it('should return validation error for non-positive targetDays', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/habits')
        .send({
          name: '测试习惯',
          icon: '✅',
          color: '#FF6B6B',
          frequency: 'daily',
          targetDays: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.targetDays).toBeDefined();
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .post('/api/habits')
        .send({
          name: '测试习惯',
          icon: '✅',
          color: '#FF6B6B',
          frequency: 'daily',
          targetDays: 7,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/habits/:id', () => {
    it('should update habit successfully', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const updateData = {
        name: '更新后的习惯',
        color: '#000000',
      };

      const response = await authRequest(token)
        .put(`/api/habits/${habitId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('更新习惯成功');
      expect(response.body.data.name).toBe('更新后的习惯');
      expect(response.body.data.color).toBe('#000000');
    });

    it('should update multiple fields', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const updateData = {
        name: '完全更新',
        icon: '🌟',
        color: '#FFFFFF',
        frequency: 'weekly' as const,
        targetDays: 5,
      };

      const response = await authRequest(token)
        .put(`/api/habits/${habitId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('完全更新');
      expect(response.body.data.icon).toBe('🌟');
      expect(response.body.data.color).toBe('#FFFFFF');
      expect(response.body.data.frequency).toBe('weekly');
      expect(response.body.data.targetDays).toBe(5);
    });

    it('should return error when habit does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .put('/api/habits/99999')
        .send({
          name: '更新的习惯',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when updating other users habit', async () => {
      const { userId: user1Id } = await createTestUser('user1', 'user1@example.com');
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');
      const habitId = createTestHabit(user1Id);

      const response = await authRequest(token2)
        .put(`/api/habits/${habitId}`)
        .send({
          name: '非法更新',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid id format', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .put('/api/habits/invalid-id')
        .send({
          name: '测试',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid update data', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const response = await authRequest(token)
        .put(`/api/habits/${habitId}`)
        .send({
          frequency: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.frequency).toBeDefined();
    });

    it('should return error without authentication', async () => {
      const { userId } = await createTestUser();
      const habitId = createTestHabit(userId);

      const response = await unauthRequest()
        .put(`/api/habits/${habitId}`)
        .send({
          name: '测试',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('should delete habit successfully', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const response = await authRequest(token).delete(`/api/habits/${habitId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('删除习惯成功');

      const habitsResponse = await authRequest(token).get('/api/habits');
      expect(habitsResponse.body.data.length).toBe(0);
    });

    it('should return error when habit does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).delete('/api/habits/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when deleting other users habit', async () => {
      const { userId: user1Id } = await createTestUser('user1', 'user1@example.com');
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');
      const habitId = createTestHabit(user1Id);

      const response = await authRequest(token2).delete(`/api/habits/${habitId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid id format', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).delete('/api/habits/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const { userId } = await createTestUser();
      const habitId = createTestHabit(userId);

      const response = await unauthRequest().delete(`/api/habits/${habitId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
