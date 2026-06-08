import {
  createTestUser,
  createTestHabit,
  createTestCheckin,
  authRequest,
  unauthRequest,
} from './helpers.js';

describe('Checkins Routes', () => {
  describe('POST /api/checkins', () => {
    it('should checkin successfully', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const checkinData = {
        habitId,
        date: '2024-01-15',
        mood: '😊',
        notes: '今天完成得很好',
      };

      const response = await authRequest(token)
        .post('/api/checkins')
        .send(checkinData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('签到成功');
      expect(response.body.data.habitId).toBe(habitId);
      expect(response.body.data.checkinDate).toBe('2024-01-15');
      expect(response.body.data.mood).toBe('😊');
      expect(response.body.data.notes).toBe('今天完成得很好');
    });

    it('should checkin without optional fields', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const checkinData = {
        habitId,
        date: '2024-01-15',
      };

      const response = await authRequest(token)
        .post('/api/checkins')
        .send(checkinData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mood).toBeNull();
      expect(response.body.data.notes).toBeNull();
    });

    it('should return error when checking in twice on same day', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      createTestCheckin(userId, habitId, '2024-01-15');

      const response = await authRequest(token)
        .post('/api/checkins')
        .send({
          habitId,
          date: '2024-01-15',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error when required fields are missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/checkins')
        .send({
          date: '2024-01-15',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.habitId).toBeDefined();
    });

    it('should return error when habit does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/checkins')
        .send({
          habitId: 99999,
          date: '2024-01-15',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when checking in other users habit', async () => {
      const { userId: user1Id } = await createTestUser('user1', 'user1@example.com');
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');
      const habitId = createTestHabit(user1Id);

      const response = await authRequest(token2)
        .post('/api/checkins')
        .send({
          habitId,
          date: '2024-01-15',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .post('/api/checkins')
        .send({
          habitId: 1,
          date: '2024-01-15',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/checkins/:id/diary', () => {
    it('should update diary successfully', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      const checkinId = createTestCheckin(userId, habitId, '2024-01-15');

      const updateData = {
        mood: '😃',
        notes: '更新后的日记内容',
      };

      const response = await authRequest(token)
        .put(`/api/checkins/${checkinId}/diary`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('更新日记成功');
      expect(response.body.data.mood).toBe('😃');
      expect(response.body.data.notes).toBe('更新后的日记内容');
    });

    it('should update only mood', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      const checkinId = createTestCheckin(userId, habitId, '2024-01-15', '😊', '原始笔记');

      const response = await authRequest(token)
        .put(`/api/checkins/${checkinId}/diary`)
        .send({
          mood: '😢',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mood).toBe('😢');
      expect(response.body.data.notes).toBe('原始笔记');
    });

    it('should return error when checkin does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .put('/api/checkins/99999/diary')
        .send({
          mood: '😊',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when updating other users checkin', async () => {
      const { userId: user1Id } = await createTestUser('user1', 'user1@example.com');
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');
      const habitId = createTestHabit(user1Id);
      const checkinId = createTestCheckin(user1Id, habitId, '2024-01-15');

      const response = await authRequest(token2)
        .put(`/api/checkins/${checkinId}/diary`)
        .send({
          mood: '😊',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid id format', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .put('/api/checkins/invalid-id/diary')
        .send({
          mood: '😊',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const { userId } = await createTestUser();
      const habitId = createTestHabit(userId);
      const checkinId = createTestCheckin(userId, habitId, '2024-01-15');

      const response = await unauthRequest()
        .put(`/api/checkins/${checkinId}/diary`)
        .send({
          mood: '😊',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/checkins', () => {
    it('should undo checkin successfully', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      createTestCheckin(userId, habitId, '2024-01-15');

      const response = await authRequest(token)
        .delete('/api/checkins')
        .send({
          habitId,
          date: '2024-01-15',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('取消签到成功');
    });

    it('should return error when checkin does not exist', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);

      const response = await authRequest(token)
        .delete('/api/checkins')
        .send({
          habitId,
          date: '2024-01-15',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error when required fields are missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .delete('/api/checkins')
        .send({
          habitId: 1,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.date).toBeDefined();
    });

    it('should return error when undoing other users checkin', async () => {
      const { userId: user1Id } = await createTestUser('user1', 'user1@example.com');
      const { token: token2 } = await createTestUser('user2', 'user2@example.com');
      const habitId = createTestHabit(user1Id);
      createTestCheckin(user1Id, habitId, '2024-01-15');

      const response = await authRequest(token2)
        .delete('/api/checkins')
        .send({
          habitId,
          date: '2024-01-15',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .delete('/api/checkins')
        .send({
          habitId: 1,
          date: '2024-01-15',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/checkins/:date', () => {
    it('should get checkins by date', async () => {
      const { userId, token } = await createTestUser();
      const habitId1 = createTestHabit(userId, '习惯1');
      const habitId2 = createTestHabit(userId, '习惯2');
      createTestCheckin(userId, habitId1, '2024-01-15');
      createTestCheckin(userId, habitId2, '2024-01-15');
      createTestCheckin(userId, habitId1, '2024-01-16');

      const response = await authRequest(token).get('/api/checkins/2024-01-15');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取签到记录成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array when no checkins on date', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/checkins/2024-01-15');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return error when date parameter is missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/checkins/');

      expect(response.status).toBe(404);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest().get('/api/checkins/2024-01-15');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/checkins/history/list', () => {
    it('should get checkin history by date range', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      createTestCheckin(userId, habitId, '2024-01-10');
      createTestCheckin(userId, habitId, '2024-01-15');
      createTestCheckin(userId, habitId, '2024-01-20');

      const response = await authRequest(token)
        .get('/api/checkins/history/list')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取签到历史成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    it('should return only checkins within date range', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      createTestCheckin(userId, habitId, '2024-01-05');
      createTestCheckin(userId, habitId, '2024-01-15');
      createTestCheckin(userId, habitId, '2024-02-05');

      const response = await authRequest(token)
        .get('/api/checkins/history/list')
        .query({
          startDate: '2024-01-10',
          endDate: '2024-01-20',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].checkinDate).toBe('2024-01-15');
    });

    it('should return error when startDate is missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .get('/api/checkins/history/list')
        .query({
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error when endDate is missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .get('/api/checkins/history/list')
        .query({
          startDate: '2024-01-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .get('/api/checkins/history/list')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/checkins/calendar/:year/:month', () => {
    it('should get checkin calendar for month', async () => {
      const { userId, token } = await createTestUser();
      const habitId = createTestHabit(userId);
      createTestCheckin(userId, habitId, '2024-01-05');
      createTestCheckin(userId, habitId, '2024-01-15');
      createTestCheckin(userId, habitId, '2024-01-25');

      const response = await authRequest(token).get('/api/checkins/calendar/2024/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取签到日历成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return validation error for invalid year', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/checkins/calendar/invalid/1');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid month', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/checkins/calendar/2024/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest().get('/api/checkins/calendar/2024/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
