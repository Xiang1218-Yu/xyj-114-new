import request from 'supertest';
import app from '../app.js';
import {
  createTestUser,
  createTestHabit,
  createTestCheckin,
  createTestTeam,
  addTeamMember,
} from './helpers.js';

describe('Leaderboard Routes', () => {
  describe('GET /api/leaderboard/personal', () => {
    it('should return personal leaderboard', async () => {
      const user1 = await createTestUser('user1', 'user1@example.com');
      const user2 = await createTestUser('user2', 'user2@example.com');
      const user3 = await createTestUser('user3', 'user3@example.com');

      const habit1 = createTestHabit(user1.userId);
      const habit2 = createTestHabit(user2.userId);
      const habit3 = createTestHabit(user3.userId);

      createTestCheckin(user1.userId, habit1, '2024-01-01');
      createTestCheckin(user1.userId, habit1, '2024-01-02');
      createTestCheckin(user1.userId, habit1, '2024-01-03');

      createTestCheckin(user2.userId, habit2, '2024-01-01');
      createTestCheckin(user2.userId, habit2, '2024-01-02');

      createTestCheckin(user3.userId, habit3, '2024-01-01');

      const response = await request(app).get('/api/leaderboard/personal');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取个人排行榜成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data[0].username).toBe('user1');
      expect(response.body.data[0].checkinCount).toBe(3);
      expect(response.body.data[1].username).toBe('user2');
      expect(response.body.data[1].checkinCount).toBe(2);
      expect(response.body.data[2].username).toBe('user3');
      expect(response.body.data[2].checkinCount).toBe(1);
    });

    it('should return empty array when no users have checkins', async () => {
      await createTestUser('user1', 'user1@example.com');
      await createTestUser('user2', 'user2@example.com');

      const response = await request(app).get('/api/leaderboard/personal');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return correct rank numbers', async () => {
      const user1 = await createTestUser('user1', 'user1@example.com');
      const user2 = await createTestUser('user2', 'user2@example.com');

      const habit1 = createTestHabit(user1.userId);
      const habit2 = createTestHabit(user2.userId);

      createTestCheckin(user1.userId, habit1, '2024-01-01');
      createTestCheckin(user1.userId, habit1, '2024-01-02');
      createTestCheckin(user2.userId, habit2, '2024-01-01');

      const response = await request(app).get('/api/leaderboard/personal');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].rank).toBe(1);
      expect(response.body.data[1].rank).toBe(2);
    });
  });

  describe('GET /api/leaderboard/team', () => {
    it('should return team leaderboard', async () => {
      const owner1 = await createTestUser('owner1', 'owner1@example.com');
      const owner2 = await createTestUser('owner2', 'owner2@example.com');
      const member1 = await createTestUser('member1', 'member1@example.com');

      const team1 = createTestTeam(owner1.userId, '团队A', '描述A', 'TEAMA');
      const team2 = createTestTeam(owner2.userId, '团队B', '描述B', 'TEAMB');
      addTeamMember(team1, member1.userId);

      const habit1 = createTestHabit(owner1.userId);
      const habit2 = createTestHabit(member1.userId);
      const habit3 = createTestHabit(owner2.userId);

      createTestCheckin(owner1.userId, habit1, '2024-01-01');
      createTestCheckin(owner1.userId, habit1, '2024-01-02');
      createTestCheckin(member1.userId, habit2, '2024-01-01');
      createTestCheckin(member1.userId, habit2, '2024-01-02');
      createTestCheckin(member1.userId, habit2, '2024-01-03');

      createTestCheckin(owner2.userId, habit3, '2024-01-01');

      const response = await request(app).get('/api/leaderboard/team');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取团队排行榜成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data[0].name).toBe('团队A');
      expect(response.body.data[0].totalCheckins).toBe(5);
      expect(response.body.data[1].name).toBe('团队B');
      expect(response.body.data[1].totalCheckins).toBe(1);
    });

    it('should return empty array when no teams exist', async () => {
      const response = await request(app).get('/api/leaderboard/team');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return correct member count', async () => {
      const owner1 = await createTestUser('owner1', 'owner1@example.com');
      const member1 = await createTestUser('member1', 'member1@example.com');
      const member2 = await createTestUser('member2', 'member2@example.com');

      const team1 = createTestTeam(owner1.userId, '测试团队', '描述', 'TESTTEAM');
      addTeamMember(team1, member1.userId);
      addTeamMember(team1, member2.userId);

      const response = await request(app).get('/api/leaderboard/team');

      expect(response.body.data[0].memberCount).toBe(3);
    });

    it('should return correct rank numbers', async () => {
      const owner1 = await createTestUser('owner1', 'owner1@example.com');
      const owner2 = await createTestUser('owner2', 'owner2@example.com');

      const team1 = createTestTeam(owner1.userId, '团队1', '描述1', 'RANK1');
      const team2 = createTestTeam(owner2.userId, '团队2', '描述2', 'RANK2');

      const habit1 = createTestHabit(owner1.userId);
      const habit2 = createTestHabit(owner2.userId);

      createTestCheckin(owner1.userId, habit1, '2024-01-01');
      createTestCheckin(owner1.userId, habit1, '2024-01-02');
      createTestCheckin(owner2.userId, habit2, '2024-01-01');

      const response = await request(app).get('/api/leaderboard/team');

      expect(response.body.data[0].rank).toBe(1);
      expect(response.body.data[1].rank).toBe(2);
    });
  });
});
