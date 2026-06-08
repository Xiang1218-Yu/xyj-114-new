import request from 'supertest';
import app from '../app.js';
import { createTestUser, authRequest, unauthRequest } from './helpers.js';
import type { ApiResponse, AuthResponse, User } from '../../shared/types.js';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.username).toBe('newuser');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return validation error when required fields are missing', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return error when passwords do not match', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error when email format is invalid', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.email).toBeDefined();
    });

    it('should return error when username already exists', async () => {
      await createTestUser('existinguser', 'existing@example.com', 'password123');

      const response = await request(app).post('/api/auth/register').send({
        username: 'existinguser',
        email: 'newemail@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return error when email already exists', async () => {
      await createTestUser('user1', 'same@example.com', 'password123');

      const response = await request(app).post('/api/auth/register').send({
        username: 'user2',
        email: 'same@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error for empty fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(Object.keys(response.body.errors).length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const { password } = await createTestUser(
        'loginuser',
        'login@example.com',
        'password123'
      );

      const response = await request(app).post('/api/auth/login').send({
        username: 'loginuser',
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.username).toBe('loginuser');
    });

    it('should return error when username is incorrect', async () => {
      await createTestUser('correctuser', 'correct@example.com', 'password123');

      const response = await request(app).post('/api/auth/login').send({
        username: 'wronguser',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error when password is incorrect', async () => {
      await createTestUser('testuser', 'test@example.com', 'password123');

      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return validation error when username is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.username).toBeDefined();
    });

    it('should return validation error when password is missing', async () => {
      const response = await request(app).post('/api/auth/login').send({
        username: 'testuser',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.password).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const { userId, token } = await createTestUser(
        'meuser',
        'me@example.com',
        'password123'
      );

      const response = await authRequest(token).get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('获取用户信息成功');
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.username).toBe('meuser');
      expect(response.body.data.email).toBe('me@example.com');
      expect(response.body.data).not.toHaveProperty('password_hash');
    });

    it('should return error without token', async () => {
      const response = await unauthRequest().get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('未授权访问');
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token无效或已过期');
    });

    it('should return error with expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.invalid';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
