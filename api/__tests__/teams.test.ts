import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  authRequest,
  unauthRequest,
} from './helpers.js';

describe('Teams Routes', () => {
  describe('GET /api/teams', () => {
    it('should return teams list for authenticated user', async () => {
      const { userId, token } = await createTestUser();
      const teamId1 = createTestTeam(userId, '团队1', '团队1描述', 'CODE1');
      const teamId2 = createTestTeam(userId, '团队2', '团队2描述', 'CODE2');

      const response = await authRequest(token).get('/api/teams');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取团队列表成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return teams that user is a member of', async () => {
      const { userId: user1Id, token: token1 } = await createTestUser(
        'user1',
        'user1@example.com'
      );
      const { userId: user2Id, token: token2 } = await createTestUser(
        'user2',
        'user2@example.com'
      );
      const teamId = createTestTeam(user1Id, '测试团队', '描述', 'CODE123');
      addTeamMember(teamId, user2Id);

      const response = await authRequest(token2).get('/api/teams');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(teamId);
    });

    it('should return empty array when user is not in any team', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/teams');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest().get('/api/teams');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team successfully', async () => {
      const { userId, token } = await createTestUser();

      const teamData = {
        name: '新团队',
        description: '这是一个新团队',
      };

      const response = await authRequest(token).post('/api/teams').send(teamData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('创建团队成功');
      expect(response.body.data.name).toBe('新团队');
      expect(response.body.data.description).toBe('这是一个新团队');
      expect(response.body.data.ownerId).toBe(userId);
      expect(response.body.data.inviteCode).toBeDefined();
      expect(response.body.data.inviteCode.length).toBeGreaterThan(0);
    });

    it('should return validation error when required fields are missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/teams')
        .send({
          name: '缺少描述的团队',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.description).toBeDefined();
    });

    it('should return validation error for empty fields', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/teams')
        .send({
          name: '',
          description: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.name).toBeDefined();
      expect(response.body.errors.description).toBeDefined();
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .post('/api/teams')
        .send({
          name: '测试团队',
          description: '描述',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/teams/join', () => {
    it('should join team successfully with valid invite code', async () => {
      const { userId: ownerId } = await createTestUser('owner', 'owner@example.com');
      const { token: memberToken } = await createTestUser('member', 'member@example.com');
      const inviteCode = 'JOIN123';
      createTestTeam(ownerId, '测试团队', '描述', inviteCode);

      const response = await authRequest(memberToken)
        .post('/api/teams/join')
        .send({
          inviteCode,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('加入团队成功');
    });

    it('should return error when invite code does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/teams/join')
        .send({
          inviteCode: 'INVALID',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when already a member', async () => {
      const { userId, token } = await createTestUser();
      const inviteCode = 'ALREADY123';
      createTestTeam(userId, '测试团队', '描述', inviteCode);

      const response = await authRequest(token)
        .post('/api/teams/join')
        .send({
          inviteCode,
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error when invite code is missing', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token)
        .post('/api/teams/join')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.inviteCode).toBeDefined();
    });

    it('should return error without authentication', async () => {
      const response = await unauthRequest()
        .post('/api/teams/join')
        .send({
          inviteCode: 'TEST123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return team detail for member', async () => {
      const { userId, token } = await createTestUser();
      const teamId = createTestTeam(userId, '测试团队', '团队描述', 'CODE123');

      const response = await authRequest(token).get(`/api/teams/${teamId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取团队详情成功');
      expect(response.body.data.id).toBe(teamId);
      expect(response.body.data.name).toBe('测试团队');
      expect(response.body.data.description).toBe('团队描述');
      expect(response.body.data.inviteCode).toBe('CODE123');
    });

    it('should return error when team does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/teams/99999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when user is not a member', async () => {
      const { userId: ownerId } = await createTestUser('owner', 'owner@example.com');
      const { token: otherToken } = await createTestUser('other', 'other@example.com');
      const teamId = createTestTeam(ownerId, '私有团队', '描述', 'PRIVATE');

      const response = await authRequest(otherToken).get(`/api/teams/${teamId}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid id format', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/teams/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const { userId } = await createTestUser();
      const teamId = createTestTeam(userId);

      const response = await unauthRequest().get(`/api/teams/${teamId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teams/:id/members', () => {
    it('should return team members for member', async () => {
      const { userId: ownerId, token: ownerToken } = await createTestUser(
        'owner',
        'owner@example.com'
      );
      const { userId: member1Id } = await createTestUser('member1', 'member1@example.com');
      const { userId: member2Id } = await createTestUser('member2', 'member2@example.com');
      const teamId = createTestTeam(ownerId, '测试团队', '描述', 'MEMBERS123');
      addTeamMember(teamId, member1Id);
      addTeamMember(teamId, member2Id);

      const response = await authRequest(ownerToken).get(`/api/teams/${teamId}/members`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取团队成员成功');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    it('should return error when team does not exist', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/teams/99999/members');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return error when user is not a member', async () => {
      const { userId: ownerId } = await createTestUser('owner', 'owner@example.com');
      const { token: otherToken } = await createTestUser('other', 'other@example.com');
      const teamId = createTestTeam(ownerId, '测试团队', '描述', 'PRIVATE2');

      const response = await authRequest(otherToken).get(`/api/teams/${teamId}/members`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for invalid id format', async () => {
      const { token } = await createTestUser();

      const response = await authRequest(token).get('/api/teams/invalid-id/members');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error without authentication', async () => {
      const { userId } = await createTestUser();
      const teamId = createTestTeam(userId);

      const response = await unauthRequest().get(`/api/teams/${teamId}/members`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
